# Watchbot alternative

This bot (formerly known as Argus) is an alternative to Watchbot. If you want to use it, you will have to host it yourself (Instructions below). This code is now public due to me not having the time to maintain the bot, but if you want you can host this yourself and make it a public bot. If you are using this code, I kindly ask that you include a link or note somewhere in your project crediting this repository.

### Bot showcase

If you are running a watchbot alternative, message me on Discord (@kartoffelchipss) or any other platform, so I cann add it to this list

### Installation

1. Install dependencies

    ```shell
    npm i
    ```

2.  Create a `.env` file with the following contents
    ```shell
    DEVMODE="true OR false (If set to true, commands will be registered in the devguild and the subdomain offset will be set to 1)"
    ID="ID OF YOUR DISCORD BOT"
    SECRET="CLIENT SECRET OF YOUR DISCORD BOT"
    TOKEN="TOKEN OF YOUR DISCORD BOT"
    PERMISSIONS="274877933568"

    MONGOURI="MONGODB CONNECTION URI"

    WHITELIST="true OR false (If set to true, only users in the whitelist.json file will be able to access the bot and website)"

    PORT="YOUR PORT FOR THE WEBSERVER"
    DOMAIN="YOUR DOMAIN (e.g. http://localhost:8000 or https://example.com)"
    USINGCUSTOMDOMAIN="true OR false (Only set to true if you are using a custom domain)"

    IONOS_SMTP_USER="SMTP USERNAME FOR SENDING E-MAILS"
    IONOS_SMTP_PWD="SMTP PASSWORD FOR SENDING E-MAILS"
    ```

3. Start the bot
    ```shell
    npm run start
    ```
