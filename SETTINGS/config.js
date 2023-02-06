// Fast Level Up Bot V 4.0 Config

/// Take your time filling in this file. Read green text for instructions.

module.exports = {
	
    USERNAME: "",
    PASSWORD: "",
    SHAREDSECRET: "",
    IDENTITYSECRET: "",
    STEAMAPIKEY: "",
	Trade_Link: "", // your bot's trade link
    INVITETOGROUPID: "103582791462553544", // Invite users to this group
	
	Promo_Code: "", //If you received a Promo Code from my bot (https://steamcommunity.com/id/FastLevels), put it in here. If other people use your Promo Code on my bot, you'll be rewarded with Free Keys! Leave this field blank if you don't want to advertise your promo code
	
	ID: "", // part after /id, for example: https://steamcommunity.com/id/FastLevels
    Owner: ["","",""],  // In the first slot, put in the SteamID of the bot (between ""), after that put in the SteamID's of admins (so you get access to Admin commands)
	Activation_Key: "", // Paste here the Activation Key you received when Buying the bot from Go Fast / Fast Bots. The Key may only be used for a single account.
	Swap_Bot: "", // (Only do this if you have a Swap Bot) put in SteamID64 of your swap bot so that the level bot will send tf2,bg,emotes,gems automatically. If you dont have a swap bot purchase one here: https://steamcommunity.com/id/FastLevels
	
	Email: { // Email Settings. Have your bot email you for weekly profits + warning emails when it needs restocking,etc.. Read tutorial for info on how to setup the email system
		
		emailToggle: 1, // Enable/Disable emails -> 0 = OFF | 1 = ON
		Username: "", // Your bot's email address (You'll need to create a new email account, use gmail. We haven't tested other email services), include @gmail.com at the end
		Password: "", // Your bot's email password
		sendTo: "", // Send emails to your personal email address (Not the bot's!)
		Alert: 50 // Your bot will email you when it has less than 50 Card Sets
	},
	Msg_Suppliers: ["","",""],  // fill in steamid 64 of your suppliers. the bot will msg them when he has enough items for supply
	Ignore_Msgs: ["","",""], // the bot will ignore msg's from these users + ignore trade offers [it won't decline or accept], (useful for when you want to buy sets from other bots & don't want them to block eachother)
	// fill in steamid 64 of these accounts.
	Set4SetLimit: 2, // max amount of sets users can use in !set4set
    KEYSFROMGAME: 440,
    MAXMSGPERSEC: 2, // The amount of messages users can send every second without getting removed+blocked.
	Comment_After_Trade: "",  // Comment this after trade (leave blank if you don't want to comment)
	
	Restrictions:{
		Convert_To_Gems: 0, // Enable/Disable items convertion to gems. If set to 1 the bot will automatically convert backgrounds+emotes to gems (except those that are included in ItemsNotForTrade). Also, make sure you set this to 0 if you want to send them to swap bot
		Convert_Amount: 10, // only convert emotes,gems that are worth max 10 gems (20,40,100 gems items won't be converted)
		SellEnable: 1, // !Sell toggle, 0 = disabled
		Swap_Bot_Deliveries: 0, // Set to 0 if you want level bot to deliver stuff to swap bot OR 1 to enable deliveries
		Send_BG_And_Emotes: 0, // Enable/Disable bg + emotes delivery to swap bot. 0 = disabled
		Delivery_Frequency: 1, // Deliver items from level-> swap bot every X hours
		Max_TF2: 10, // level bot will send swap bot max of 10 tf2 keys (swap bot will only have a max of 10 keys in its inventory on deliveries)
		Max_Gems: 10000, // level bot will only have max 10,000 gems in its inv. rest will be sent to swap bot
		Msg_Suppliers_Frequency: 3, // Msg suppliers every X Hours
		Msg_Suppliers_Amount: 10 // Msg suppliers when you have at least 10 keys
	},
    Rates: {
		
		// *NOTE* : When you sell/buy sets the bot will msg you with the amount of profit you made. This is determined by your buy & sell rates below.
		// For example: if your TF2 buy rate is 10 and your TF2 sell rate is 20 -> The bot will assume you've made 10 sets profit in TF2 trades (per key)
			
			
			
			// Skin Deposits (CS:GO Skins only)
			
		Skins: {
		
			Starting: 1, // the skin's price on the market must be $1+ (It won't give credits if people deposit bad items such as cases,etc or skins below $1)
			Rate: [1,10], // For each $1 skin you'll give 10 Sets. For example: if some1 sends a $10 skin, he will receive 100 Sets
			// To change the rate: first number is amount of skin $, the second number is the amount of sets
			// Users Deposit skins & then use !Collect to collect sets for credits
			Quantity: 5 // the skin must have at least 5 copies on the market
			

		},
			// Buy Rates
		Set4Cards_Rate: 10, // You're giving 1 Set for 10 Random Cards by using !Set4Cards
		Hydra_Rate: 5, 	// !Hydra Rate, you're giving 5 sets for their 1 hydra key.
		CSGO_Buy: 10, // !BuyCS Rate, you're giving 19 sets for their 1 csgo
        TF2_Buy: 17, // !BuyTF Rate, you're giving 19 sets for their 1 tf2
		Gem_Buy: 100, // !Gem4Set Rate, you're giving 1 set for their 1000 gems | This is also !Crap4Sets rate. divide this number by 10 (in your head) - this is how many bg+emotes you charge per 1 set
		 
		   // Sell Rates
		 
		CSGO_Sell: 25, // !Sellcs rate, giving 1 csgo for their 25 sets
		TF2_Sell: 2, // !selltf rate, giving 1 tf2 for their 22 sets
		Gems_Sell: 250, // My gems per Their Set
		Key_To_Gems: 8000, // !Key4Gem Rate. you're giving 8000 gems for 1 of their TF2 Key
		
		
		MaxBackgroundAndEmote: 20, // trade a max of 20 bg,emotes at a time in !swap
		ItemsNotForTrade: [':bluequestion:',':gr_cat:','','','','',''], // don't trade these items in !swap, don't send them to swap bot on deliveries, don't turn them to gems. Add steam item name between ' '
		// you can add more items by extending this pattern. Do this right or get rekt.
        MAXSETSELL: 5, // The maximum amount of sets of a kind the bot will send when !sell is used
    },
	
	Giveaways: {
		Giveaway_Frequency: 50, // Start a giveaway every 50 sales
		Comment_On_My_Profile: "", // Comment the bot will post on it's profile when giveaway is available
	},
    MESSAGES: {
		BROADCAST: "", // broadcast msg
        WELCOME: "Welcome to My Level Up Bot! Use !help for commands!", // welcome msg
        HELP: "↓ ↓ ↓ \r\n\r\n                         ★ Level Up Commands: ★ \r\n-------------------------------\r\n✔ !Level [Your Dream Level] ► Check how much it costs to get to your Dream Level! \r\n✔ !BuyTF [Number of TF2 Keys] ► Buy Card Sets for your Team Fortress 2 Keys!\r\n✔ !BuyCS [Number of CSGO Keys] ► Buy Card Sets for your CSGO Keys!\r\n✔ !Hydra [Number of Hydra Keys] ► Buy Card Sets for your Hydra Keys\r\n\r\n✔ !Deposit ► See how to Deposit CS:GO Skins to get Credits\r\n✔ !Collect ► Collect Sets for your Credits\r\n\r\n✔ !CheckMe ► See what Level you can get to with items in your Inventory!\r\n ✔ !Crap4Sets [Number of Sets you want] ► Get Sets for your Backgrounds/Emotes! \r\n ✔ !Gem4Set [Number of Sets you want] ► Get Card Sets for your Gems!\r\n✔ !Set4Cards <Number of Sets> ► Get Full Sets for your Random cards  \r\n\r\n                         ★ Sell Commands: ★ \r\n-------------------------------\r\n✔ !Free [Guess a Number between 1-100] ► Win Free Sets every 50 Sales we make!\r\n✔ !SellCheck ► Check how many Keys you get for Your Sets\r\n✔ !Sell [Number of My Keys] ► Sell Your Card Sets for My TF2 Keys\r\n\✔ !SellCS [Number of My Keys] ► Sell Your Card Sets for My CSGO Keys\r\n✔ !Key4Gem [Number of Keys You're giving] ► Sell me Your TF2 Keys for My Gems\r\n✔ !Sell4Gems [Amount of your Sets] ► Sell Your Card Sets for My Gems\r\n\r\n                         ★ Information Commands: ★ \r\n-------------------------------\r\n✔ !Check ► See how many Sets we have which you have NOT crafted!\r\n✔ !Price ► Check out Selling & Buying Prices\r\n✔ !info ► Information about the Owner & Staff \r\n\r\n★ !Promo ► See how to get your Own Steam Bots with a Discount!\r\n\r\n✔ !help2 ► Page 2 for Commands ",
		HELP2: "↓ ↓ ↓ \r\n\r\n                         ★ Extra Commands: ★\r\n-------------------------------\r\n✔ !BuyAny [Amount of TF2 Keys] ► Buy Any Card Sets for Your TF2 Keys \r\n✔ !BuyCs [Amount of CS:GO Keys] ► Buy Card Sets for Your CS:GO Keys",
		ADMINHELP: "↓ ↓ ↓ \r\n\r\n                         ★ Admin Commands: ★ \r\n-------------------------------\r\n✔ !Mail ► Send a test Email to test the email system is setup\r\n✔ !Profit ► Check the profits made in the last 24 hours\r\n✔ !Block [SteamID64] ► Block a user\r\n✔ !Unblock [SteamID64] ► Unblock a user\r\n✔ !Broadcast ► Send a message to everyone in your friend list (Set the msg in config -> BROADCAST)\r\n✔ !Sets [Amount] ► Move sets from your Main Account -> Bot",
        SELLHELP: "You are also able to sell sets. You can do this by using !sell [amount of keys].",
        MAXLEVEL: 1000, // Max level you can request using !level
        MAXBUY: 60, // Max keys you can buy sets for at a time
        MAXSELL: 300 // Max keys you can sell sets for at a time
    },
	CSGO_Keys: [ // CSGO Keys you're giving & accept. Delete or add a new line to add/remove keys
	"Clutch Case Key",
	"Glove Case Key",
	"Gamma Case Key",
	"Gamma 2 Case Key",
	"Chroma Case Key",
	"Chroma 2 Case Key",
	"Chroma 3 Case Key",
	"Spectrum Case Key",
	"Spectrum 2 Case Key",
	"Operation Phoenix Case Key",
	"Falchion Case Key",
	"Operation Breakout Case Key",
	"Operation Wildfire Case Key",
	"eSports Key",
	"Winter Offensive Case Key",
	"Operation Vanguard Case Key",
	"Shadow Case Key",
	"Horizon Case Key",
	"Danger Zone Case Key",
	"Prisma Case Key"
	],
    ACCEPTEDKEYS: [ // TF2 Keys you're giving & accept. Delete or add a new line to add/remove keys
		"Mann Co. Supply Crate Key"
    ],
	Hydra:[
		"Operation Hydra Case Key"
	]

}
