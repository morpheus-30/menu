# WhatsApp setup (free)

You forward the menu photo to a WhatsApp number; the site reads it and updates itself.
Uses Meta's official WhatsApp Cloud API with its free test number.

Your webhook URL will be: `https://YOUR-DOMAIN/api/whatsapp`
(use your production domain, e.g. `https://menu.iamnaksh.tech/api/whatsapp`)

## 1. Create the Meta app
1. Go to https://developers.facebook.com and log in (create a developer account if asked).
2. My Apps -> Create App -> choose "Other" -> app type **Business** -> name it (e.g. "Menu bot").
3. On the app dashboard, find **WhatsApp** and click Set up. If it asks for a Business portfolio, create a free one.

## 2. Get the test number and add yourself
1. Left menu: WhatsApp -> **API Setup** (or Getting started).
2. Meta gives you a free **test phone number**. Note two things on that page:
   - **Phone number ID** (a long number) -> this is `WHATSAPP_PHONE_NUMBER_ID`
   - the test number itself (the number you will message)
3. Under "To", click "Manage phone number list" and add **your own WhatsApp number**. Enter the code WhatsApp sends you to verify it.
4. Click "Send message" with the Hello World template once. This opens the chat with the test number on your phone.

## 3. Get a permanent token (important)
The temporary token on the API Setup page expires in 24 hours. Make a permanent one:
1. https://business.facebook.com/settings -> Users -> **System users** -> Add (role: Admin). Name it "menu-bot".
2. Select it -> **Add assets** -> Apps -> pick your app -> turn on **Full control**.
3. **Generate new token** -> pick your app -> set expiry to **Never** -> tick `whatsapp_business_messaging` and `whatsapp_business_management` -> Generate.
4. Copy it. This is `WHATSAPP_TOKEN`.

## 4. App secret
App dashboard -> App settings -> **Basic** -> App secret -> Show. This is `WHATSAPP_APP_SECRET`.

## 5. Add env vars in Vercel
Project -> Settings -> Environment Variables. Tick **Production, Preview and Development**.

| Name | Value |
| --- | --- |
| `WHATSAPP_TOKEN` | the permanent token from step 3 |
| `WHATSAPP_PHONE_NUMBER_ID` | from step 2 |
| `WHATSAPP_APP_SECRET` | from step 4 |
| `WHATSAPP_VERIFY_TOKEN` | any random string you invent, e.g. `menu-verify-83921` |
| `ALLOWED_NUMBERS` | your number, country code first, digits only, e.g. `919876543210` (comma-separate for more) |

Then **redeploy** (env changes only apply to new builds). Make sure `GROQ_API_KEY` and `BLOB_READ_WRITE_TOKEN` are also set.

## 6. Connect the webhook
1. App dashboard -> WhatsApp -> **Configuration** -> Webhook -> Edit.
2. Callback URL: `https://YOUR-DOMAIN/api/whatsapp`
3. Verify token: the same string as `WHATSAPP_VERIFY_TOKEN`.
4. Click **Verify and save**. (It fails if the deploy isn't finished or the env vars are missing.)
5. Under Webhook fields, click Manage and **subscribe to `messages`**.

## 7. Use it
- Forward or send the menu photo to the test number. The bot replies "Got it, reading the menu…", then "Menu updated ✅".
- Send it as a **Document / file** instead of a photo if the text looks blurry; WhatsApp compresses photos.
- If it flags something, it tells you what; resend a clearer, upright photo.
- Send the word `remove` to clear the current menu.
- Any other text gets a short help message.

## Troubleshooting
- **Webhook won't verify:** verify token mismatch, or the latest deploy hasn't finished / env vars weren't redeployed.
- **No reply at all:** check `messages` is subscribed (step 6.5), your number is in `ALLOWED_NUMBERS` (digits only), and look at Vercel -> Logs for `/api/whatsapp`.
- **Stopped working after a day:** you used the temporary token. Do step 3.
- **Bot can't reply:** WhatsApp only lets the bot reply within 24 hours of your last message; just message it again first.
- **"Groq error":** same causes as the web upload (model name or API key).
