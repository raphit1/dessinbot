// index.js
import express from 'express';
import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import 'dotenv/config';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '5mb' }));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel]
});

client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);
  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    await channel.send("🎨 Le bot est en ligne et prêt à recevoir des œuvres !");
  } catch (err) {
    console.error("Erreur d'envoi de message d'accueil :", err);
  }
});

// API pour recevoir une œuvre
app.post('/api/draw', async (req, res) => {
  const { title, image } = req.body;
  if (!title || !image) return res.status(400).json({ error: "Manque le titre ou l'image" });

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    await channel.send({
      content: `🖼️ Nouvelle œuvre : **${title}**`,
      files: [{
        attachment: image,
        name: `${title.replace(/\s+/g, '_')}.png`
      }]
    });
    res.json({ message: "✅ Ton œuvre a été postée dans le salon !" });
  } catch (err) {
    console.error("Erreur d'envoi dans Discord :", err);
    res.status(500).json({ error: "Erreur lors de l'envoi au channel Discord." });
  }
});

app.get('/', (req, res) => {
  res.send("🎨 Serveur de dessin du bot Discord actif.");
});

app.listen(PORT, () => {
  console.log(`🌐 Serveur Express actif sur http://localhost:${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
