import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits } from 'discord.js';

// Crée le client Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const app = express();
const PORT = process.env.PORT || 3000;

// Pour parser JSON et accepter les grosses images base64
app.use(express.json({ limit: '10mb' }));

// Route test simple
app.get('/', (req, res) => {
  res.send('🎨 Bot de dessin opérationnel !');
});

// Route POST pour recevoir l'image + titre du frontend
app.post('/submit-artwork', async (req, res) => {
  try {
    const { image, title } = req.body;

    if (!image || !title) {
      return res.status(400).json({ message: 'Image ou titre manquant.' });
    }

    // Récupérer le channel Discord
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      return res.status(500).json({ message: 'Salon Discord introuvable ou non textuel.' });
    }

    // Convertir base64 en Buffer (en retirant "data:image/png;base64," si présent)
    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Envoyer dans Discord avec titre + fichier image
    await channel.send({
      content: `🖼️ Nouvelle œuvre : **${title}**`,
      files: [{ attachment: buffer, name: 'oeuvre.png' }],
    });

    // Toujours répondre en JSON
    return res.json({ message: 'Œuvre envoyée avec succès !' });
  } catch (error) {
    console.error('Erreur dans /submit-artwork :', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Démarrer express + Discord
app.listen(PORT, () => {
  console.log(`Express lancé sur http://localhost:${PORT}`);
});

// Connexion du bot Discord
client.login(process.env.DISCORD_TOKEN);

client.once('ready', () => {
  console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);
});
