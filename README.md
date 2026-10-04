
## note

this bot uscks 

i removed the slash commands because they r very useless, i am too lazy to clean up the 'global ban' shit though lol sorry

a stupid little discord bot dedicated to kicking anyone named `emma`.

## setup

### 1. install dependencies

```bash
npm install
```

### 2. create `.env`

```env
DISCORD_TOKEN=your_bot_token
```

### 3. start the bot

```bash
node index.js
```

## required permissions

the bot needs:

* Kick Members
* Ban Members

the bot should also have a role high enough to moderate the users it needs to kick or ban.

## files

```text
.
├── index.js
├── kicks.json
├── bans.json
├── disabled.json
├── package.json
└── .env
```

`kicks.json` stores kick history.

`bans.json` stores globally banned users.

`disabled.json` stores servers where automatic global bans are disabled.

