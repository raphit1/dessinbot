// index.js
import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits, Events, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;
const CHANNEL_ID = '1381864670511501323';

// Pour parser le JSON (important pour les requêtes POST)
app.use(bodyParser.json({ limit: '10mb' }));

// Juste une page d’accueil
app.get('/', (req, res) => {
  res.send('🎨 Bot de dessin actif !');
});

// Discord.js setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Route pour recevoir le dessin
app.post('/submit-drawing', async (req, res) => {
  try {
    const { imageData, title } = req.body;

    if (!imageData || !title) {
      return res.status(400).send('Titre ou image manquants.');
    }

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      return res.status(500).send('Channel introuvable.');
    }

    // Convertir l’image base64 en buffer
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const attachment = new AttachmentBuilder(imageBuffer, { name: 'dessin.png' });

    const embed = new EmbedBuilder()
      .setTitle(`🎨 Nouvelle œuvre : ${title}`)
      .setImage('attachment://dessin.png')
      .setColor(0x0099ff)
      .setFooter({ text: 'Envoyé via l’application de dessin' });

    await channel.send({
      embeds: [embed],
      files: [attachment],
    });

    // Réponse à l’app
    res.status(200).send('✅ Dessin envoyé avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l’envoi du dessin :', error);
    res.status(500).send('Erreur serveur.');
  }
});

// Démarrer le serveur express
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});

// Connexion Discord
client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
