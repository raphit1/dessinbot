import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events } from 'discord.js';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const DRAW_BUTTON_ID = 'draw_button';
const { DISCORD_TOKEN, CHANNEL_ID, DRAW_APP_URL } = process.env;

// Route d’accueil pour test
app.get('/', (req, res) => {
  res.send('Bot dessin actif !');
});

// 🚨 Endpoint appelé par le site de dessin
app.post('/submit-drawing', async (req, res) => {
  const { imageData, title, user } = req.body;
  if (!imageData || !title || !user) return res.status(400).send('Champs manquants');

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    await channel.send({
      content: `🖼️ Nouvelle œuvre par <@${user}> : **${title}**`,
      files: [{ attachment: imageData, name: `${title}.png` }],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(DRAW_BUTTON_ID)
            .setLabel('✏️ Dessiner une autre œuvre')
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });

    res.sendStatus(200);
  } catch (err) {
    console.error('Erreur lors de l’envoi Discord :', err);
    res.sendStatus(500);
  }
});

// 🔘 Gestion du bouton pour dessiner
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== DRAW_BUTTON_ID) return;

  const userId = interaction.user.id;
  const drawLink = `${DRAW_APP_URL}?user=${userId}`;

  await interaction.reply({
    content: `🎨 Clique ici pour dessiner : ${drawLink}`,
    ephemeral: true
  });
});

// 🔁 À démarrage, poste le bouton dans le salon
client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  const channel = await client.channels.fetch(CHANNEL_ID);

  const drawButton = new ButtonBuilder()
    .setCustomId(DRAW_BUTTON_ID)
    .setLabel('✏️ Dessiner une œuvre')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(drawButton);

  await channel.send({
    content: '🎨 Clique ci-dessous pour créer une œuvre artistique :',
    components: [row]
  });
});

client.login(DISCORD_TOKEN);
app.listen(port, () => console.log(`🎉 Serveur Express lancé sur http://localhost:${port}`));
