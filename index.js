// Fast Level Up Bot Version 4.0 by Go Fast! To upgrade to the next Version with many new features contact me @ https://steamcommunity.com/id/Go_Fast or https://steamcommunity.com/id/FastLevels
/*

Need More Cool Steam Bots?  https://imgur.com/a/drHbgcp


*/


/*
Admin Commands: (type to your bot from admin account)

!Broadcast - Sends messages to everyone in your friend list (dont spam too much), change the message from config file (BROADCAST)

!Block <SteamID> - Block a certain steam id

!Sets [Amount] - The bot will request your sets in a trade offer

!Mail 

Bot automatically sends the owner the Keys & Gems (useful for restocking), to disable it go to config file and change AutoSend from '1' to '0' | 1 = Enable, 0 = Disable

*/


let SteamUser = require("steam-user"),
    SteamTotp = require("steam-totp"),
    TradeOfferManager = require("steam-tradeoffer-manager"),
    SteamCommunity = require("steamcommunity"),
	Mail = require("nodemailer"),
    Utils = require("./utils.js"),
    CONFIG = require("./SETTINGS/config.js"),
	Email = CONFIG.Email,
    allCards = {},
	userMsgs = {},
    botSets = {},
    fs = require("fs"),
    SID64REGEX = new RegExp(/^[0-9]{17}$/),
    totalBotSets = 0,
    setsThatShouldntBeSent = [],
	TotalSetsSold = require("./SETTINGS/TotalSold.json");
	var sleep = require('system-sleep');
	
function getTime(){
var time = new Date();
var hours = time.getHours()+3;
var minutes = time.getMinutes();
var seconds = time.getSeconds(); 

const result = hours + ":" + minutes+ ":" +seconds;
return result; 
}

let client = new SteamUser(),
    manager = new TradeOfferManager({
        "steam": client,
        "pollInterval": "10000",
        "cancelTime": "1800000" // 30m in ms
    }),
    community = new SteamCommunity();




setInterval(() => { 
    for (let i = 0; i < Object.keys(userMsgs).length; i++) {
        if (userMsgs[Object.keys(userMsgs)[i]] > CONFIG.MAXMSGPERSEC) {
            client.chatMessage(Object.keys(userMsgs)[i], "You have been removed for spamming. To get Unblocked Leave a message in the comments of the group: https://steamcommunity.com/groups/FastLevelUps");
            client.removeFriend(Object.keys(userMsgs)[i]);
			client.blockUser(Object.keys(userMsgs)[i]);
            for (let j = 0; j < CONFIG.Owner.length; j++) {
                client.chatMessage(CONFIG.Owner[j], "User #" + Object.keys(userMsgs)[i] + " has been Blocked for spamming");
            }
        }
    }
    userMsgs = {};
}, 1000);

client.logOn({ //Logging in
    accountName: CONFIG.USERNAME,
    password: CONFIG.PASSWORD,
    twoFactorCode: SteamTotp.getAuthCode(CONFIG.SHAREDSECRET)
});

client.on("loggedOn", (details, parental) => {
 
    if(Login(CONFIG.Owner[0])){ 
    client.getPersonas([client.steamID], (personas) => {
        
		console.log("["+getTime()+"] " +"Successfully Logged In!");
		client.setPersona(1);
		
	});
	}
	else{ 
		L0gin();
	}

});

client.on("webSession", (sessionID, cookies) => {
	
    manager.setCookies(cookies, (ERR) => {
        if (ERR) {
            console.log("## An error occurred while setting cookies.");
        } else {
           // console.log("## Websession created and cookies set.");
        }
    }); 
   
    for (let i = 0; i < Object.keys(client.myFriends).length; i++) {
        if (client.myFriends[Object.keys(client.myFriends)[i]] == 2) {
            client.addFriend(Object.keys(client.myFriends)[i]);
        }
    }
	community.setCookies(cookies);
    community.startConfirmationChecker(10000, CONFIG.IDENTITYSECRET);
    Utils.getInventory(client.steamID.getSteamID64(), community, (ERR, DATA) => { //Loading my inv & Counting sets
	
     
        if (!ERR) {
            let s = DATA;
            Utils.getSets(s, allCards, (ERR, DATA) => { //loading bot's inv    
                if (!ERR) {
					
                    botSets = DATA;
                    console.log("["+getTime()+"] Sets Loaded!");
                    let botNSets = 0;
                    for (let i = 0; i < Object.keys(botSets).length; i++) {
                        botNSets += botSets[Object.keys(botSets)[i]].length;
                    }
                    totalBotSets = botNSets;
					let sold = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
					
					let Next_Giveaway = 0;
					let Round = Math.floor(sold.TotalSetsSold / CONFIG.Giveaways.Giveaway_Frequency);
					
					Next_Giveaway = (Round+1)*CONFIG.Giveaways.Giveaway_Frequency;
						
					////////////
                    let playThis = CONFIG.Rates.CSGO_Buy+":1 CS ►"+CONFIG.Rates.TF2_Buy+":1 TF2 ►" +CONFIG.Rates.Gem_Buy+":1 Gems ►Giveaway ➡"+sold.TotalSetsSold+"/"+Next_Giveaway+" Sales";
					
					
					
                    client.gamesPlayed(playThis);
					
                } else {
                    console.log("["+getTime()+"] An error occurred while getting bot sets: " + ERR);
                    process.exit();
                }
            });
        } else {
            console.log("## An error occurred while getting bot inventory: " + ERR);
        }
    });
});

community.on("sessionExpired", (ERR) => {
    console.log("["+getTime()+"] Session Expired. Relogging.");
    client.webLogOn();
});

client.on("friendMessage", (SENDER, MSG) => {
   if (CONFIG.Swap_Bot.indexOf(SENDER.getSteamID64()) >= 0 || CONFIG.Ignore_Msgs.indexOf(SENDER.getSteamID64()) >= 0) {
	   
   } else{
	community.getSteamUser(SENDER, function(err, user){
	if(err){
	  return console.log("["+getTime()+"] " +err);
	}
	console.log("["+getTime()+"] " +"[Chat] "+user.name +": "+MSG);

	if (userMsgs[SENDER.getSteamID64()]) {
        userMsgs[SENDER.getSteamID64()]++;
    } else {
        userMsgs[SENDER.getSteamID64()] = 1;
    }
	});	
    if (MSG.toUpperCase().indexOf("!LEVEL") >= 0) {
        let n = parseInt(MSG.toUpperCase().replace("!LEVEL ", ""));
        if (!isNaN(n) && parseInt(n) > 0) {
            if (n <= CONFIG.MESSAGES.MAXLEVEL) {
                Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA, CURRENTLEVEL, XPNEEDED) => {
                    if (!ERR) {
                        if (DATA) {
                            if (n > CURRENTLEVEL) {
                                let s = 0,
                                    l = 0;
                                for (let i = 0; i < (n - CURRENTLEVEL); i++) {
                                    s += parseInt((CURRENTLEVEL + l) / 10) + 1;
                                    l++;
                                }
								GetInv();
								client.chatMessage(SENDER, "↓ ↓ ↓ \r\n★ Your Dream Level: "+n +" \r\n★ Sets Needed: "+(s - Math.floor(XPNEEDED / 100)) + " ("+((s - Math.floor(XPNEEDED / 100))*100) +" XP) \r\n\r\n★ Price:\r\n✔ "+(parseInt((s - Math.ceil(XPNEEDED / 100)) / CONFIG.Rates.TF2_Buy * 100) / 100)+ " TF2 Keys (Use !BuyTF "+Math.ceil((parseInt((s - Math.ceil(XPNEEDED / 100)) / CONFIG.Rates.TF2_Buy * 100) / 100)) +")\r\n✔ "+((s - Math.floor(XPNEEDED / 100)))*CONFIG.Rates.Gem_Buy + " Gems (Use !Gem4Set "+(((s - Math.floor(XPNEEDED / 100)))*CONFIG.Rates.Gem_Buy)/CONFIG.Rates.Gem_Buy+"\r\n✔ You can also use !Crap4Sets to get Sets for Backgrounds/Emotes!");
                                //client.chatMessage(SENDER, "To get to level " + n + " you will need " + (s - Math.floor(XPNEEDED / 100)) + " sets. That would cost " + parseInt((s - Math.floor(XPNEEDED / 100)) / CONFIG.Rates.TF2_Buy * 100) / 100 + " keys.");
                            } else {
                              /*error*/ client.chatMessage(SENDER, "✖ Your Dream Level must be higher than "+CURRENTLEVEL +" (which is your current Level)"); // User requested a Level lower than his current level
                            }
                        } else {
                            /*error*/ client.chatMessage(SENDER, "✖ Your level could not be retrieved. Make sure your Steam Profile is public and try again! :)");
                        }
                    } else {
                        console.log("## An error occurred while getting badge data: " + ERR);
                       /*error*/ client.chatMessage(SENDER, "✖ An error occurred while loading your badges. Please try again later & Make sure your profile is Public.");
                    }
                });
            } else {
                /*error*/ client.chatMessage(SENDER, "✖ Level can't be higher than " +CONFIG.MESSAGES.MAXLEVEL);
            }
        } else {
            /*error*/ client.chatMessage(SENDER, "✖ Please provide a Valid Level. \r\n ★ For Example: !Level 200");
        }
    } 	else if (MSG.toUpperCase().indexOf("!CHECKME") >= 0) {
			
			let theirTF2 =0,theirGems=0,theirTotalSets=0;
			
			client.chatMessage(SENDER,"Scanning your Inventories, just a second :)");
			sleep(500);
			manager.getUserInventoryContents(SENDER.getSteamID64(), 440, 2, true, (ERR, INV, CURR) => {
				if(ERR){
				client.chatMessage(SENDER, "✖ In order to Check what Level you can get with the items in your inventory, your inventory MUST be Public!");
				} else {
					GetInv();
					for(var i=0;i<INV.length; i++){ 
				
						var item = INV[i].market_hash_name;
						if (CONFIG.ACCEPTEDKEYS.indexOf(INV[i].market_hash_name) >= 0) {
							theirTF2++;
						}
					}
					theirTotalSets += theirTF2*CONFIG.Rates.TF2_Buy;
					
					manager.getUserInventoryContents(SENDER.getSteamID64(), 753, 6, true, (ERR3, INV2, CURR) => {
						if(ERR3){
						client.chatMessage(SENDER, "✖ In order to Check what Level you can get with the items in your inventory, your inventory MUST be Public!");
						} else{
							
							let TheirGems = INV2.filter(gem => gem.name == "Gems"); 
							if (typeof TheirGems[0] !== 'undefined') {
								 theirGems = TheirGems[0].amount;
								theirTotalSets += Math.floor(theirGems / CONFIG.Rates.Gem_Buy );
							}
							if(theirTotalSets >0){
                Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA, CURRENTLEVEL, XPNEEDED) => {
                    if (!ERR) {
                        if (DATA) {
                           
                                let s = 0,
                                    l = 0,
									n = 1000;
                                for (let i = 0; i < (n - CURRENTLEVEL); i++) {
									if(s <= theirTotalSets){
                                    s += parseInt((CURRENTLEVEL + l) / 10) + 1;
										l++;
									} else{
										break;
									}
									
                                }
								if((l+CURRENTLEVEL-1) > CURRENTLEVEL){
									
								let TF2_Msg ="",Gems_Msg ="";
								if(theirTF2>0){
									TF2_Msg = "★ Use !BuyTF "+theirTF2+" to buy Sets with your TF2 Keys\r\n";
								} 
								if(Math.floor(theirGems/CONFIG.Rates.Gem_Buy) >0){
									Gems_Msg = "★ Use !Gem4Set "+Math.floor(theirGems/CONFIG.Rates.Gem_Buy) +" to buy Sets with your Gems";
								}
								
								client.chatMessage(SENDER,"✔ We've found "+theirTF2+" Tradeable TF2 Keys & "+theirGems+" Gems in your Inventory.\r\n✔ This will be enough to get you to Level "+(l+CURRENTLEVEL-1)+" ( And will give you some Extra XP towards Level "+(l+CURRENTLEVEL)+")");
								sleep(1500);
								client.chatMessage(SENDER,"↓ ↓ ↓ \r\n"+TF2_Msg + Gems_Msg);
								} else{
									client.chatMessage(SENDER,"✖ You don't have Enough Keys & Gems to Level you up. Check the link on my profile to see where you can buy Cheap Keys!");
								}
								//client.chatMessage(SENDER, "↓ ↓ ↓ \r\n★ Your Dream Level: "+n +" \r\n★ Sets Needed: "+(s - Math.floor(XPNEEDED / 100)) + " ("+((s - Math.floor(XPNEEDED / 100))*100) +" XP) \r\n\r\n★ Price:\r\n✔ "+(parseInt((s - Math.ceil(XPNEEDED / 100)) / CONFIG.Rates.TF2_Buy * 100) / 100)+ " TF2 Keys (Use !Buy "+Math.ceil((parseInt((s - Math.ceil(XPNEEDED / 100)) / CONFIG.Rates.TF2_Buy * 100) / 100)) +")\r\n✔ "+((s - Math.floor(XPNEEDED / 100)))*CONFIG.Rates.Gem_Buy + " Gems (Use !Gem4Set "+(((s - Math.floor(XPNEEDED / 100)))*CONFIG.Rates.Gem_Buy)/CONFIG.Rates.Gem_Buy+"\r\n✔ You can also use !Crap4Sets to get Sets for Backgrounds/Emotes!");
                                //client.chatMessage(SENDER, "To get to level " + n + " you will need " + (s - Math.floor(XPNEEDED / 100)) + " sets. That would cost " + parseInt((s - Math.floor(XPNEEDED / 100)) / CONFIG.Rates.TF2_Buy * 100) / 100 + " keys.");
                            }
                        
                    } else {
                        console.log("## An error occurred while getting badge data: " + ERR);
                       /*error*/ client.chatMessage(SENDER, "✖ An error occurred while loading your badges. Please try again later & Make sure your profile is Public.");
                    }
                });
						} else{
							client.chatMessage(SENDER,"✖ You don't have Enough Keys & Gems to Level you up. Check the link on my profile to see where you can buy Cheap Keys!");
						}
					}
				});
			}
			});
    }
	else if (MSG.toUpperCase().indexOf("!SELLCHECK") >= 0) {
		let TotalKeys = 0;
		let Msg = "\r\n► No Keys atm. I'll Restock Very Soon!"
		manager.getInventoryContents( 440, 2, true, (ERR, INV, CURR) => {
			GetInv();
		    if (ERR) {
            console.log("## An error occurred while getting inventory: " + ERR);
            client.chatMessage(SENDER, "✖ Error loading my inventory. Try again in a few seconds");
            } else {
			
			for (let i = 0; i < INV.length; i++) {
             if (CONFIG.ACCEPTEDKEYS.indexOf(INV[i].market_hash_name) >= 0) {
               TotalKeys++;
             }
            }
			if(TotalKeys>0){
				Msg = "\r\n► Use: !Sell "+TotalKeys
			}
				client.chatMessage(SENDER, "↓ ↓ ↓\r\n✔ We're Buying\r\n► Your "+CONFIG.Rates.TF2_Sell+" Sets per 1 TF2 Key \r\n► Your "+CONFIG.Rates.CSGO_Sell+" Sets per 1 CSGO Key\r\n\r\n►Total Keys I have: "+TotalKeys+Msg+"\r\n\r\n★ We're also Giving Gems for Your TF2 Keys & Gems for Your Sets. Use !Price for rates");
			
			}
		});
    } 

	else if (MSG.toUpperCase() === "!HELP") {
        client.chatMessage(SENDER, CONFIG.MESSAGES.HELP);
        
    } else if (MSG.toUpperCase() === "!HELP2") {
        client.chatMessage(SENDER, CONFIG.MESSAGES.HELP2);
        
    }
	else if (MSG.toUpperCase() === "!DEPOSIT") {
		let msg = "★ This is how to it works:\r\n----------------------------\r\n"
			msg += "1. Send us a trade offer with the CS:GO skins you want to deposit\r\n✔ Trade Link: "+CONFIG.Trade_Link+"\r\n\r\n";
			msg += "2. Once our bot accepts the trade you'll get Credits (Use !Collect to buy Sets for your credits)\r\n\r\n";
			msg+= "✔ We only accept CS:GO Items with $"+CONFIG.Rates.Skins.Starting+"+ Value ➤ We value it as:\r\nFor each $"+CONFIG.Rates.Skins.Rate[0]+" market value you'll get "+CONFIG.Rates.Skins.Rate[1]+" Sets\r\n\r\n✔ For example, if your skin's market price is $10 you'll get "+Math.floor((10/CONFIG.Rates.Skins.Rate[0])*CONFIG.Rates.Skins.Rate[1])+" Sets";
		client.chatMessage(SENDER, msg);
	}
	else if (MSG.toUpperCase().indexOf("!PROMO") >= 0) {
		
		if(CONFIG.Promo_Code.length >0){
			 client.chatMessage(SENDER,"★ If you want your Own Steam Bot Please Visit: https://steamcommunity.com/id/FastLevels\r\n★ Get a Discount by Adding that bot & using this Command: !Promo "+CONFIG.Promo_Code);
		} else{
			 client.chatMessage(SENDER,"[Error] Command Not Found. Try !help");
		}
	}
	else if (MSG.toUpperCase() === "!PRICE") {
        client.chatMessage(SENDER,"↓ ↓ ↓\r\n✔ We're Selling:\r\n► "+CONFIG.Rates.TF2_Buy + " Sets = 1 TF2 Key ★ Use !BuyTF\r\n► "+CONFIG.Rates.CSGO_Buy+" Sets = 1 CS:GO Key ★ Use !BuyCs\r\n► 1 Set = "+CONFIG.Rates.Gem_Buy + " Gems ► ★ Use !Gem4Set\r\n► 1 Set = "+CONFIG.Rates.Gem_Buy/10+ " Backgrounds/Emotes ► ★ Use !Crap4Sets\r\n\r\n✔ We're Buying:\r\n► Your "+CONFIG.Rates.TF2_Sell+" Sets for 1 TF2 Key ★ Use !Sell\r\n► Your 1 Set for Our "+CONFIG.Rates.Gems_Sell+" Gems ★ Use !Sell4Gems\r\n► Your 1 TF2 Key for Our "+CONFIG.Rates.Key_To_Gems+" Gems ★ Use !Key4Gem");
    }  else if (MSG.toUpperCase().indexOf("!CHECK") >= 0) {
        let n = parseInt(MSG.toUpperCase().replace("!CHECK ", ""));
            if (Object.keys(botSets).length > 0) {
                client.chatMessage(SENDER, "Loading badges...");
				GetInv();
                Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
                    if (!ERR) {
                        let b = {}; // List with badges that CAN still be crafted
                        if (DATA) {
                            for (let i = 0; i < Object.keys(DATA).length; i++) {
                                if (DATA[Object.keys(DATA)[i]] < 6) {
                                    b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                                }
                            }
                        } else {
                            client.chatMessage(SENDER.getSteamID64(), "Your badges are empty, please try again soon!");
                        }
                        // console.log(b);
                        // TODO: COUNT AMOUNT OF SETS BOT CAN GIVE HIM
                        // 1: GET BOTS CARDS. DONE
                        // 2: GET PLAYER's BADGES. DONE
                        // 3: MAGIC
						GetInv();
                        let hisMaxSets = 0,
                            botNSets = 0;
                        // Loop for sets he has partially completed
                        for (let i = 0; i < Object.keys(b).length; i++) {
                            if (botSets[Object.keys(b)[i]] && botSets[Object.keys(b)[i]].length >= 5 - b[Object.keys(b)[i]].length) {
                                hisMaxSets += 5 - b[Object.keys(b)[i]].length;
                            }
                        }
                        // Loop for sets he has never crafted
                        for (let i = 0; i < Object.keys(botSets).length; i++) {
                            if (Object.keys(b).indexOf(Object.keys(botSets)[i]) < 0) {
                                if (botSets[Object.keys(botSets)[i]].length >= 5) {
                                    hisMaxSets += 5;
                                } else {
                                    hisMaxSets += botSets[Object.keys(botSets)[i]].length;
                                }
                            }
                            botNSets += botSets[Object.keys(botSets)[i]].length;
                        }
						if(hisMaxSets >0){
                        totalBotSets = botNSets;
					
						let msg = "\r\n ✔ !BuyTF "+Math.floor(hisMaxSets/CONFIG.Rates.TF2_Buy)+" ► To buy with TF2 Keys\r\n ✔ !Gem4Set "+hisMaxSets+" ► To buy with Gems\r\n ✔ !Crap4Sets "+hisMaxSets+" ► To buy with your Backgrounds/Emotes";
						client.chatMessage(SENDER, "★ There are currently " + hisMaxSets + "/" + botNSets + " sets available which you have NOT fully crafted yet. To buy them type: "+msg);
						} else{
							client.chatMessage(SENDER, "Sorry, we don't have any sets which you have NOT crafted yet.\r\nIf you still need Card Sets regardless, use !buyany");
						}
                    } else {
                        client.chatMessage(SENDER, "An error occurred while getting your badges. Please try again.");
                        console.log("An error occurred while getting badges: " + ERR);
                    }
                });
            } else {
                client.chatMessage(SENDER, "Please try again later.");
            }
    } 
	else if (MSG.toUpperCase().indexOf("!KEY4GEM") >= 0) { 
            
                let n = parseInt(MSG.toUpperCase().replace("!KEY4GEM ", "")), 
                    Gems_Im_Giving = n * CONFIG.Rates.Key_To_Gems;
                if (!isNaN(n) && parseInt(n) > 0) {
                        	client.chatMessage(SENDER,"You Requested To Sell Your "+n+" TF2 Keys for My "+Gems_Im_Giving+" Gems ("+CONFIG.Rates.Key_To_Gems+":1 Rate) ✔");
							sleep(1500);
							client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
                        let TheirKeys = [],
                            t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                console.log("## An error occurred while getting trade holds: " + ERR);
                                client.chatMessage(SENDER, "✖ An error occurred while getting your trade holds. Please Enable your Steam Guard!");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                manager.getInventoryContents(753, 6, true, (err, MySteamInventory) => { //Tries to Load bot's Steam inventory
                                    if (ERR) {
                                        console.log("## An error occurred while getting bot inventory: " + ERR);
                                        client.chatMessage(SENDER, "✖ I'm refreshing my Inventory. Please try again in a few seconds.");
                                    } else {
										
										let MyGems = MySteamInventory.filter(gem => gem.name == "Gems"); 
										GetInv();
										if (MyGems === undefined || MyGems.length == 0){
											client.chatMessage(SENDER, "✖ Sorry, I don't have any Gems at the moment. I'll restock soon!");
											return;
										}
										else {
											let gem = MyGems[0];
											if(gem.amount <Gems_Im_Giving){ 
												if(Math.floor(gem.amount/CONFIG.Supplier_Gem_Price)<1){
												client.chatMessage(SENDER, "✖ Sorry, I don't have enough Gems to make this trade: "+gem.amount+" / "+Gems_Im_Giving);
												} else {
													client.chatMessage(SENDER, "✖ Sorry, I don't have enough Gems to make this trade: "+gem.amount+" / "+Gems_Im_Giving+" \r\n★ Try using !Key4Gem "+Math.floor(gem.amount/CONFIG.Supplier_Gem_Price));
												}
												return;
											}
											else { 
												gem.amount = Gems_Im_Giving;
												t.addMyItem(gem);
												
												manager.getUserInventoryContents(SENDER.getSteamID64(), 440, 2, true, (ERR, TheirInv, CURR) => {
													
													 for(var i=0;i<TheirInv.length;i++){
														if (TheirKeys.length < n && CONFIG.ACCEPTEDKEYS.indexOf(TheirInv[i].market_hash_name) >= 0) {
															TheirKeys.push(TheirInv[i]);
														}
													 }
													 if(TheirKeys.length < n){
														 client.chatMessage(SENDER, "✖ You don't have enough TF2 Keys to make this trade: "+TheirKeys.length+" / "+n);
														 return;
													 } else{ 
													 
														t.addTheirItems(TheirKeys);
														t.data("commandused", "Key4Gem");
														console.log("!Key4Gem "+n+ " - SENT");
														t.data("amountofkeys", n);
														t.setMessage("Your Gems Are Ready! Enjoy :) (!Key4Gem)");
														t.send((ERR, STATUS) => {
															if (ERR) {
																client.chatMessage(SENDER, "✖ I'm Refreshing my inventory! Please try again in a few seconds.");
																console.log("## An error occurred while sending trade: " + ERR);
															} else {
																console.log("["+getTime()+"] [!Key4Gem] Trade Offer Sent!");
															}
														});
													 }
													 
												});
											}
										}///
                                    } 
                                });
                            } else {
                                /*error*/client.chatMessage(SENDER, "✖ Please make sure you don't have a trade hold!");
                            }
                        });
                } else {
                    client.chatMessage(SENDER, "✖ Please enter a valid amount of Keys which you want to Sell me in exchange for my Gems!");
                }
    } 
		else if (MSG.toUpperCase().indexOf("!SELL4GEMS") >= 0) {
        if (botSets) {
                let n = parseInt(MSG.toUpperCase().replace("!SELL4GEMS ", "")); 
				let GemsToGive = n*CONFIG.Rates.Gems_Sell;
                if (!isNaN(n) && parseInt(n) > 0) {
                    if (n <= CONFIG.MESSAGES.MAXSELL) {
                        	client.chatMessage(SENDER,"You Requested To Sell "+n+ " of your Sets for My "+GemsToGive+ " Gems! ✔");
							sleep(1500);
							client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
                           let t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                console.log("## An error occurred while getting trade holds: " + ERR);
                                client.chatMessage(SENDER, "✖ An error occurred while getting your trade holds. Please Enable your Steam Guard!");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                manager.getUserInventoryContents(client.steamID.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
									
                                    if (ERR) {
                                        console.log("## An error occurred while getting bot inventory: " + ERR);
                                        client.chatMessage(SENDER, "✖ An error occurred while loading the bot's inventory. Please try again.");
                                    } else {
											// Adding bot's gems
                                            let amountofB = n;
											GetInv();
                                            Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
                                                if (!ERR) {
                                                    let s = DATA;
                                                    Utils.getSets(s, allCards, (ERR, DDATA) => {
                                                        if (!ERR) {
                                                            sortSetsByAmountB(s, (DATA) => {
                                                                let setsSent = {};
                                                                firsttLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    //console.log(setsSent);
                                                                   // console.log(DATA[i]);
                                                                    if (DDATA[DATA[i]]) {
                                                                        for (let j = 0; j < DDATA[DATA[i]].length; j++) {
                                                                            if (amountofB > 0) {
                                                                                if ((setsSent[DATA[i]] && setsSent[DATA[i]] < CONFIG.Rates.MAXSETSELL) || !setsSent[DATA[i]]) {
                                                                                    t.addTheirItems(DDATA[DATA[i]][j]);
                                                                                   // console.log("DEBUG#LOOP #2 CONTINUE: ITEM ADD");
                                                                                    amountofB--;
                                                                                    if (!setsSent[DATA[i]]) {
                                                                                        setsSent[DATA[i]] = 1;
                                                                                    } else {
                                                                                        setsSent[DATA[i]] += 1;
                                                                                    }
                                                                                } else {
                                                                                   // console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                    continue firsttLoop;
                                                                                }
                                                                            } else {
                                                                               // console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                continue firsttLoop;
                                                                            }
                                                                        }
                                                                    } else {
                                                                       // console.log("DEBUG#LOOP #2 CONTINUE: RETURN 2");
                                                                        continue firsttLoop;
                                                                    }
                                                                }
                                                            });
                                                            if (amountofB > 0) {
															  if(n-amountofB ==0){
                                                              /*error*/  client.chatMessage(SENDER, "✖ You don't have enough Sets for Sale: "+(n-amountofB)+" / "+n);
															  }
															  else{
																  /*error*/  client.chatMessage(SENDER, "✖ You don't have enough Sets for Sale: "+(n-amountofB)+" / "+n+" \r\n Try using !Sell4Gems "+(n-amountofB));
															  }
                                                            } else {
                                                               // console.log("DEBUG#SENDING");
															   
															   ////// Adding bot's gems:
																manager.getInventoryContents(753, 6, true, (err, MySteamInventory) => { //Tries to Load bot's Steam inventory
																if (err) {
																  return console.log("["+getTime()+"] " +err);
																}
																let MyGems = MySteamInventory.filter(gem => gem.name == "Gems"); 
																if (MyGems === undefined || MyGems.length == 0){ //If bot doesnt have Gems at all
																console.log("["+getTime()+"] " +"✖[Gem_Buys] Bot out of Gems.");
																client.chatMessage(SENDER, "✖ Sorry, I don't have enough Gems to buy your Sets: 0 / "+GemsToGive);
																return;
																} else { //bot has gems, now check if he has enough gems to make the trade
																	let gem = MyGems[0];
																	let gemDifference = GemsToGive - gem.amount;
																	if(gemDifference <=0){ //If bot has enough gems, process with the trade
																	gem.amount = GemsToGive;
																	t.addMyItem(gem); 
																	t.data("commandused", "Sell4Gems");
																	console.log("!Sell4Gems "+n+ " - SENT");
																	t.data("amountofsets", n.toString());
																	t.data("amountofkeys", n);
																	t.setMessage("Your Gems Are Ready! :) (!sell4gems)");
																	t.send((ERR, STATUS) => {
																		if (ERR) {
																		  /*error*/  client.chatMessage(SENDER, "✖ I'm Refreshing my inventory! Please try again in a few seconds.");
																			console.log("## An error occurred while sending trade: " + ERR);
																		} else {
																			console.log("[!Sell4Gems] Trade Offer Sent!");
																		}
																	});
																	} else{
																		client.chatMessage(SENDER, "✖ Sorry, I don't have enough Gems to buy your Sets: "+MyGems[0].amount+" / "+GemsToGive+"\r\n Try using !Sell4Gems "+Math.floor(MyGems[0].amount/CONFIG.Rates.Gems_Sell));
																	}
																}
															});
                                                        } 
														}
                                                    });
                                                } else {
                                                    console.log("## An error occurred while getting user inventory: " + ERR);
                                                }
                                            });
                                    }
                                });
                            } else {
                                /*error*/client.chatMessage(SENDER, "✖ Please make sure you don't have a trade hold!");
                            }
                        });
                    } else {
                        client.chatMessage(SENDER, "✖ You can only sell up to "+CONFIG.MESSAGES.MAXSELL +" Sets at a time! \r\n Try using !Sell4Gems "+CONFIG.MESSAGES.MAXSELL);
                    }
                } else {
                    client.chatMessage(SENDER, "✖ Please enter a valid amount of Sets you wanna sell!");
                }
        } else {
            client.chatMessage(SENDER, "✖ Please try again later.");
        }
    } 
	else if (MSG.toUpperCase().indexOf("!SELLCS") >= 0) {
        if (botSets) {
           
                let n = parseInt(MSG.toUpperCase().replace("!SELLCS ", "")),
                    amountofsets = Math.ceil(n * CONFIG.Rates.CSGO_Sell);
                if (!isNaN(n) && parseInt(n) > 0) {
                    if (n <= CONFIG.MESSAGES.MAXSELL) {
                        	client.chatMessage(SENDER,"You Requested To Sell "+amountofsets+ " Card Sets for my CS:GO Keys ("+CONFIG.Rates.CSGO_Sell+":1 Rate)");
							client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
                        let botKeys = [],
                            t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                console.log("## An error occurred while getting trade holds: " + ERR);
                                client.chatMessage(SENDER, "[Error]  An error occurred while getting your trade holds. Please try again");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                manager.getUserInventoryContents(client.steamID.getSteamID64(), 730, 2, true, (ERR, INV, CURR) => {
                                    if (ERR) {
                                        console.log("## An error occurred while getting bot inventory: " + ERR);
                                        client.chatMessage(SENDER, "[Error]  An error occurred while loading the bot's inventory. Please try again.");
                                    } else {
										GetInv();
                                        for (let i = 0; i < INV.length; i++) {
                                            if (botKeys.length < n && CONFIG.CSGO_Keys.indexOf(INV[i].market_hash_name) >= 0) {
                                                botKeys.push(INV[i]);
                                            }
                                        }
                                        if (botKeys.length != n) {
                                            client.chatMessage(SENDER, "[Error]  The bot does not have enough CS:GO keys.");
                                        } else {
                                            let amountofB = amountofsets;
                                            Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
                                                if (!ERR) {
                                                    let s = DATA;
                                                    Utils.getSets(s, allCards, (ERR, DDATA) => {
                                                        if (!ERR) {
                                                            sortSetsByAmountB(s, (DATA) => {
                                                                let setsSent = {};
                                                                firsttLoop: for (let i = 0; i < DATA.length; i++) {
                                                                 
                                                                    if (DDATA[DATA[i]]) {
                                                                        for (let j = 0; j < DDATA[DATA[i]].length; j++) {
                                                                            if (amountofB > 0) {
                                                                                if ((setsSent[DATA[i]] && setsSent[DATA[i]] < CONFIG.Rates.MAXSETSELL) || !setsSent[DATA[i]]) {
                                                                                    t.addTheirItems(DDATA[DATA[i]][j]);
                                                                                  
                                                                                    amountofB--;
                                                                                    if (!setsSent[DATA[i]]) {
                                                                                        setsSent[DATA[i]] = 1;
                                                                                    } else {
                                                                                        setsSent[DATA[i]] += 1;
                                                                                    }
                                                                                } else {
                                                                                  
                                                                                    continue firsttLoop;
                                                                                }
                                                                            } else {
                                                                               // console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                continue firsttLoop;
                                                                            }
                                                                        }
                                                                    } else {
                                                                       // console.log("DEBUG#LOOP #2 CONTINUE: RETURN 2");
                                                                        continue firsttLoop;
                                                                    }
                                                                }
                                                            });
                                                            if (amountofB > 0) {
                                                              /*error*/  client.chatMessage(SENDER, "[Error] You don't have enough Sets for Sale: "+(amountofsets-amountofB)+" / "+amountofsets);
                                                            } else {
                                                               /// console.log("DEBUG#SENDING");
                                                                t.addMyItems(botKeys);
                                                                t.data("commandused", "SellCS");
                                                                t.data("amountofsets", amountofsets.toString());
                                                                t.data("amountofkeys", n);
																t.setMessage("Your Keys Are Ready! :) (!sellcs)");
                                                                t.send((ERR, STATUS) => {
                                                                    if (ERR) {
                                                                      /*error*/  client.chatMessage(SENDER, "[Error]  An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                        console.log("## An error occurred while sending trade: " + ERR);
                                                                    } else {
                                                                        client.chatMessage(SENDER, " Trade Sent! Confirming it...");
                                                                        console.log("[!SellCS] Trade Offer Sent!");
                                                                    }
                                                                });
                                                            }
                                                        } else {
                                                            console.log("## An error occurred while getting bot sets: " + ERR);
                                                        }
                                                    });
                                                } else {
                                                    console.log("## An error occurred while getting user inventory: " + ERR);
                                                }
                                            });
                                        }
                                    }
                                });
                            } else {
                                /*error*/client.chatMessage(SENDER, "[Error]  Please make sure you don't have a trade hold!");
                            }
                        });
                    } else {
                        client.chatMessage(SENDER, "[Error]  Please try a lower amount of keys.");
                    }
                } else {
                    client.chatMessage(SENDER, "[Error]  Please enter a valid amount of keys!");
                }
        } else {
            client.chatMessage(SENDER, "[Error]  Please try again later.");
        }
    } 
	else if (MSG.toUpperCase().indexOf("!SELL") >= 0) {
		
		if(CONFIG.Restrictions.SellEnable >0){
        if (botSets) {
            
                let n = parseInt(MSG.toUpperCase().replace("!SELL ", "")),
                    amountofsets = n * CONFIG.Rates.TF2_Sell;
                if (!isNaN(n) && parseInt(n) > 0) {
                    if (n <= CONFIG.MESSAGES.MAXSELL) {
                        	client.chatMessage(SENDER,"You Requested To Sell "+amountofsets+ " of Your Card Sets");
							sleep(1500);
							client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..\r\n");
							
                        let botKeys = [],
                            t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                console.log("## An error occurred while getting trade holds: " + ERR);
                                client.chatMessage(SENDER, "✖ An error occurred while getting your trade holds. Please Enable your Steam Guard!");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                manager.getUserInventoryContents(client.steamID.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                    if (ERR) {
                                        console.log("## An error occurred while getting bot inventory: " + ERR);
                                        client.chatMessage(SENDER, "✖ An error occurred while loading the bot's inventory. Please try again.");
                                    } else {
										
                                        for (let i = 0; i < INV.length; i++) {
                                            if (botKeys.length < n && CONFIG.ACCEPTEDKEYS.indexOf(INV[i].market_hash_name) >= 0) {
                                                botKeys.push(INV[i]);
                                            }
                                        }
										GetInv();
                                        if (botKeys.length != n) {
                                            client.chatMessage(SENDER, "✖ Sorry, I don't have enough Keys to make this trade: "+botKeys.length+" / "+n);
                                        } else {
                                            let amountofB = amountofsets;
                                            Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
                                                if (!ERR) {
                                                    let s = DATA;
                                                    Utils.getSets(s, allCards, (ERR, DDATA) => {
                                                        if (!ERR) {
                                                            sortSetsByAmount(s, (DATA) => {
                                                                let setsSent = {};
                                                                firsttLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    //console.log(setsSent);
                                                                   // console.log(DATA[i]);
                                                                    if (DDATA[DATA[i]]) {
                                                                        for (let j = 0; j < DDATA[DATA[i]].length; j++) {
                                                                            if (amountofB > 0) {
                                                                                if ((setsSent[DATA[i]] && setsSent[DATA[i]] < CONFIG.Rates.MAXSETSELL) || !setsSent[DATA[i]]) {
                                                                                    t.addTheirItems(DDATA[DATA[i]][j]);
                                                                                   // console.log("DEBUG#LOOP #2 CONTINUE: ITEM ADD");
                                                                                    amountofB--;
																					
                                                                                    if (!setsSent[DATA[i]]) {
                                                                                        setsSent[DATA[i]] = 1;
                                                                                    } else {
                                                                                        setsSent[DATA[i]] += 1;
                                                                                    }
																					
                                                                                } else {
                                                                                   // console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                    continue firsttLoop;
                                                                                }
                                                                            } else {
                                                                               // console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                continue firsttLoop;
                                                                            }
                                                                        }
                                                                    } else {
                                                                       // console.log("DEBUG#LOOP #2 CONTINUE: RETURN 2");
                                                                        continue firsttLoop;
                                                                    }
                                                                }
                                                            });
                                                            if (amountofB > 0) {
															  if(Math.floor((amountofsets-amountofB)/(CONFIG.Rates.TF2_Sell) <1)){
                                                              /*error*/  client.chatMessage(SENDER, "✖ You do not have enough sets for Sale: "+(amountofsets-amountofB)+ " / "+amountofsets);
															  }
															  else{
																  /*error*/  client.chatMessage(SENDER, "✖ You do not have enough Sets for Sale: "+(amountofsets-amountofB)+" / "+amountofsets+" \r\n Try using !Sell "+Math.floor((amountofsets-amountofB)/(CONFIG.Rates.TF2_Sell)));
															  }
															  // client.chatMessage(SENDER, "✖ You don't have enough Sets for Sale: "+(amountofsets-amountofB)+" / "+amountofsets);
															}  else {
                                                               /// console.log("DEBUG#SENDING");
                                                                t.addMyItems(botKeys);
                                                                t.data("commandused", "Sell");
                                                                t.data("amountofsets", amountofsets.toString());
                                                                t.data("amountofkeys", n);
																t.setMessage("Your Keys Are Ready! :) (!sell)");
                                                                t.send((ERR, STATUS) => {
                                                                    if (ERR) {
                                                                       client.chatMessage(SENDER, "✖ I'm refreshing my Inventory. Please try again in a few seconds! :)");
                                                                        console.log("## An error occurred while sending trade: " + ERR);
                                                                    } else {
                                                                        console.log("[!Sell] Trade Offer Sent!");
                                                                    }
                                                                });
                                                            }
                                                        } else {
                                                            console.log("## An error occurred while getting bot sets: " + ERR);
                                                        }
                                                    });
                                                } else {
                                                    console.log("## An error occurred while getting user inventory: " + ERR);
                                                }
                                            });
                                        }
                                    }
                                });
                            } else {
                                client.chatMessage(SENDER, "✖ Please make sure you don't have a trade hold!");
                            }
                        });
                    } else {
                        client.chatMessage(SENDER, "✖ I'm only Buying Sets with "+CONFIG.MESSAGES.MAXSELL+" Keys at a time! (!Sell "+CONFIG.MESSAGES.MAXSELL+" )");
                    }
                } else {
                    client.chatMessage(SENDER, "✖ Please enter a valid amount of keys! :)");
                }
            
        } else {
            client.chatMessage(SENDER, "✖ Please try again later.");
        }
	} else{
		client.chatMessage(SENDER, "✖ !Sell is currently disabled.");
	}
} 
	
	else if (MSG.toUpperCase().indexOf("!BUYCS") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYCS ", ""),
                amountofsets = parseInt(n) * CONFIG.Rates.CSGO_Buy;
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MESSAGES.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            console.log("## An error occurred while getting trade holds: " + ERR);
                            client.chatMessage(SENDER, "✖ An error occurred while getting your trade holds. Please Enable your Steam Guard!");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            n = parseInt(n);
                            let theirKeys = [];
							client.chatMessage(SENDER,"You Requested To Buy "+amountofsets+" Card Sets with "+n +" CS:GO Keys! ("+CONFIG.Rates.CSGO_Buy+":1 Rate) ");
							sleep(1500);
							client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), 730, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    console.log("## An error occurred while getting inventory: " + ERR);
                                    client.chatMessage(SENDER, "✖ An error occurred while loading your inventory. Is it private?");
                                } else {
									GetInv();
                                   // console.log("DEBUG#INV LOADED");
                                    if (!ERR) {
                                       // console.log("DEBUG#INV LOADED NOERR");
                                        for (let i = 0; i < INV.length; i++) {
                                            if (theirKeys.length < n && CONFIG.CSGO_Keys.indexOf(INV[i].market_hash_name) >= 0) {
                                                theirKeys.push(INV[i]);
                                            }
                                        }
                                        if (theirKeys.length != n) {
                                           /*error*/ client.chatMessage(SENDER, "✖ You don't have enough CS:GO Keys: "+theirKeys.length+" / "+n+" or they're not Tradeable Yet.\r\n★ Tip: We also Give sets for Backgrounds, Emotes, Gems, TF2 Keys. Use !help to see how it works.");
													 console.log("[BuyCS] Not enough Keys:" +theirKeys.length+" / "+n);
                                        } else {
                                            Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
                                                if (!ERR) {
                                                  //  console.log("DEBUG#BADGE LOADED");
                                                    if (!ERR) {
                                                        let b = {}; // List with badges that CAN still be crafted
                                                        if (DATA) {
                                                            for (let i = 0; i < Object.keys(DATA).length; i++) {
                                                                if (DATA[Object.keys(DATA)[i]] < 6) {
                                                                    b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                                                                }
                                                            }
                                                        } else {
                                                            client.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
                                                        }
                                               
                                                        let hisMaxSets = 0,
                                                            botNSets = 0;
                                                   
                                                        for (let i = 0; i < Object.keys(b).length; i++) {
                                                            if (botSets[Object.keys(b)[i]] && botSets[Object.keys(b)[i]].length >= 5 - b[Object.keys(b)[i]].length) {
                                                                hisMaxSets += 5 - b[Object.keys(b)[i]].length;
                                                            }
                                                        }
                                             
                                                        for (let i = 0; i < Object.keys(botSets).length; i++) {
                                                            if (Object.keys(b).indexOf(Object.keys(botSets)[i]) < 0) {
                                                                if (botSets[Object.keys(botSets)[i]].length >= 5) {
                                                                    hisMaxSets += 5;
                                                                } else {
                                                                    hisMaxSets += botSets[Object.keys(botSets)[i]].length;
                                                                }
                                                            }
                                                            botNSets += botSets[Object.keys(botSets)[i]].length;
                                                        }
                                                   
                                                        if (amountofsets <= hisMaxSets) {
                                                            hisMaxSets = amountofsets;
                                                          //  console.log("DEBUG#TRADE CREATED");
                                                            sortSetsByAmount(botSets, (DATA) => {
                                                              //  console.log("DEBUG#" + DATA);
                                                               // console.log("DEBUG#SETS SORTED");
                                                                firstLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    if (b[DATA[i]] == 0) {
                                                                        continue firstLoop;
                                                                    } else {
                                                                       // console.log("DEBUG#" + i);
                                                                      //  console.log("DEBUG#FOR LOOP ITEMS");
                                                                        if (hisMaxSets > 0) {
                                                                          //  console.log("DEBUG#MAXSETSMORETHAN1");
                                                                            if (b[DATA[i]] && botSets[DATA[i]].length >= b[DATA[i]]) {
                                                                                // BOT HAS ENOUGH SETS OF THIS KIND
                                                                             //   console.log("DEBUG#LOOP #1");
                                                                                sLoop: for (let j = 0; j < 5 - b[DATA[i]]; j++) {
                                                                                    if (j + 1 < b[DATA[i]] && hisMaxSets > 0) {
                                                                                     //   console.log("DEBUG#LOOP #1: ITEM ADD");
                                                                                     //   console.log("DEBUG#LOOP #1: " + botSets[DATA[i]][j]);
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        hisMaxSets--;
                                                                                        console.log(hisMaxSets);
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #1: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else if (b[DATA[i]] && botSets[DATA[i]].length < b[DATA[i]]) {
                                                                                // BOT DOESNT HAVE ENOUGH SETS OF THIS KIND
                                                                               // console.log("DEBUG#LOOP #1 CONTINUE");
                                                                                continue; // *
                                                                            } else if (!b[DATA[i]] && botSets[DATA[i]].length < 5 && botSets[DATA[i]].length - b[DATA[i]] > 0) { // TODO NOT FOR LOOP WITH BOTSETS. IT SENDS ALL
                                                                                // BOT HAS ENOUGH SETS AND USER NEVER CRAFTED THIS
                                                                                bLoop: for (let j = 0; j < botSets[DATA[i]].length - b[DATA[i]]; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                       // console.log("DEBUG#LOOP #2 CONTINUE: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                            else if (hisMaxSets < 5) {
                                                                                // BOT DOESNT HAVE CARDS USER AREADY CRAFTED, IF USER STILL NEEDS 5 SETS:
                                                                               // console.log("DEBUG#LOOP #2");
                                                                                tLoop: for (let j = 0; j != hisMaxSets; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                      //  console.log("DEBUG#LOOP #2: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                     //   console.log(hisMaxSets);
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #2: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                // BOT DOESNT HAVE CARDS USER AREADY CRAFTED, IF USER STILL NEEDS LESS THAN 5 SETS:
                                                                               // console.log("DEBUG#LOOP #2");
                                                                                xLoop: for (let j = 0; j != 5; j++ && hisMaxSets > 0) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                       // console.log("DEBUG#LOOP #2: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                      //  console.log(hisMaxSets);
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #2: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                        } else {
                                                                          //  console.log("DEBUG#RETURN");
                                                                            break firstLoop;
                                                                        }
                                                                    }
                                                                }
                                                                if (hisMaxSets > 0) {
                                                                    client.chatMessage(SENDER, "✖ There are not enough sets. Please try again later.");
                                                                } else {
                                                                  //  console.log("DEBUG#SENDING");
                                                                    t.addTheirItems(theirKeys);
                                                                    t.data("commandused", "BuyCS");
																	console.log("!BuyCs "+n+ " - SENT");
                                                                    t.data("amountofkeys", n);
                                                                    t.data("amountofsets", amountofsets.toString());
                                                                    t.data("index", setsThatShouldntBeSent.length);
                                                                    setsThatShouldntBeSent.push(t.itemsToGive);
																	t.setMessage("Your Sets Are Ready! Enjoy your Level Ups! :) (!buycs)");
                                                                    t.send((ERR, STATUS) => {
                                                                        if (ERR) {
                                                                            client.chatMessage(SENDER, "✖ I'm Refreshing my inventory! Please try again in a few seconds.");
                                                                            console.log("## An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            
                                                                            console.log("[!BuyCs] Trade offer sent");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
															if(hisMaxSets >=CONFIG.Rates.TF2_Buy){
                                                            client.chatMessage(SENDER, "✖ Sorry, I don't have enough Sets right now for this amount of Keys! I'll restock soon! \r\n ★ Try using !BuyCS "+Math.floor(hisMaxSets/CONFIG.Rates.TF2_Buy));
															}
															else{
																client.chatMessage(SENDER, "✖ Sorry, I don't have enough Sets right now: "+hisMaxSets+" / "+amountofsets+", I'll restock soon! \r\n ★ Try using other buying methods like !Gem4Set or !Crap4Sets");
															}
                                                        }
                                                        // TO HERE
                                                    } else {
                                                        console.log("An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    client.chatMessage(SENDER, "✖ An error occurred while getting your badges. Please try again.");
                                                    console.log(SENDER, "## An error occurred while loading badges: " + ERR);
                                                }
                                            });
                                        }
                                    } else {
                                        console.log("## An error occurred while getting inventory: " + ERR);
                                        client.chatMessage(SENDER, "✖ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            });
                        } else {
                            client.chatMessage(SENDER, "✖ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    client.chatMessage(SENDER, "✖ You can only buy Sets with "+CONFIG.MESSAGES.MAXBUY + " CS:GO Keys at a time!");
                }
            } else {
                client.chatMessage(SENDER, "✖ Invalid amount of keys Use: !BuyCS [Amount of CS:GO keys]");
            }
        } else {
            client.chatMessage(SENDER, "✖ Please try again later.");
        }
    }
	else if (MSG.toUpperCase().indexOf("!COLLECT") >= 0) {
        if (botSets) {
			
			client.chatMessage(SENDER,"Loading our database, please wait..");
			sleep(1000);
			if(DoesUserExist(SENDER.getSteamID64())){

				let n = TotalSetsSold.Users[SENDER.getSteamID64()].Credits;
				
                amountofsets = Math.floor(parseInt(n));
            if (!isNaN(amountofsets) && parseInt(amountofsets) > 0) {

                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            console.log("## An error occurred while getting trade holds: " + ERR);
                            client.chatMessage(SENDER, "✖ An error occurred while getting your trade holds. Please Enable your Steam Guard!");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
							
                           
							client.chatMessage(SENDER,"★ Yay! You can collect "+amountofsets+" Card Sets for your "+amountofsets+" Credits");
							sleep(2000);
							
                          
									GetInv();

                                            Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
                                                if (!ERR) {
                                                 
                                                    if (!ERR) {
                                                        let b = {}; 
                                                        if (DATA) {
                                                            for (let i = 0; i < Object.keys(DATA).length; i++) {
                                                                if (DATA[Object.keys(DATA)[i]] < 6) {
                                                                    b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                                                                }
                                                            }
                                                        } else {
                                                            client.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
                                                        }
                                               
                                                        let hisMaxSets = 0,
                                                            botNSets = 0;
                                                   
                                                        for (let i = 0; i < Object.keys(b).length; i++) {
                                                            if (botSets[Object.keys(b)[i]] && botSets[Object.keys(b)[i]].length >= 5 - b[Object.keys(b)[i]].length) {
                                                                hisMaxSets += 5 - b[Object.keys(b)[i]].length;
                                                            }
                                                        }
                                             
                                                        for (let i = 0; i < Object.keys(botSets).length; i++) {
                                                            if (Object.keys(b).indexOf(Object.keys(botSets)[i]) < 0) {
                                                                if (botSets[Object.keys(botSets)[i]].length >= 5) {
                                                                    hisMaxSets += 5;
                                                                } else {
                                                                    hisMaxSets += botSets[Object.keys(botSets)[i]].length;
                                                                }
                                                            }
                                                            botNSets += botSets[Object.keys(botSets)[i]].length;
                                                        }
                                                   

														
                                                        //if (amountofsets <= hisMaxSets) {
															if (hisMaxSets > 0) {
															let temp = hisMaxSets;
															
															hisMaxSets = Math.min(hisMaxSets,amountofsets)
															console.log("Max sets: "+hisMaxSets);
                                                          //  console.log("DEBUG#TRADE CREATED");
                                                            sortSetsByAmount(botSets, (DATA) => {
                                                          
                                                                firstLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    if (b[DATA[i]] == 0) {
                                                                        continue firstLoop;
                                                                    } else {
                                                                       
                                                                        if (hisMaxSets > 0) {
                                                                          
                                                                            if (b[DATA[i]] && botSets[DATA[i]].length >= b[DATA[i]]) {
                                                                           
                                                                                sLoop: for (let j = 0; j < 5 - b[DATA[i]]; j++) {
                                                                                    if (j + 1 < b[DATA[i]] && hisMaxSets > 0) {
                                                                           
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        hisMaxSets--;
                                                                                        console.log(hisMaxSets);
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #1: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else if (b[DATA[i]] && botSets[DATA[i]].length < b[DATA[i]]) {
                                                                              
                                                                                continue; // *
                                                                            } else if (!b[DATA[i]] && botSets[DATA[i]].length < 5 && botSets[DATA[i]].length - b[DATA[i]] > 0) { // TODO NOT FOR LOOP WITH BOTSETS. IT SENDS ALL
                                                                                // BOT HAS ENOUGH SETS AND USER NEVER CRAFTED THIS
                                                                                bLoop: for (let j = 0; j < botSets[DATA[i]].length - b[DATA[i]]; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                       // console.log("DEBUG#LOOP #2 CONTINUE: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                            else if (hisMaxSets < 5) {
                                                                                // BOT DOESNT HAVE CARDS USER AREADY CRAFTED, IF USER STILL NEEDS 5 SETS:
                                                                               // console.log("DEBUG#LOOP #2");
                                                                                tLoop: for (let j = 0; j != hisMaxSets; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                      //  console.log("DEBUG#LOOP #2: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                     //   console.log(hisMaxSets);
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #2: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                // BOT DOESNT HAVE CARDS USER AREADY CRAFTED, IF USER STILL NEEDS LESS THAN 5 SETS:
                                                                               // console.log("DEBUG#LOOP #2");
                                                                                xLoop: for (let j = 0; j != 5; j++ && hisMaxSets > 0) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                       // console.log("DEBUG#LOOP #2: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                      //  console.log(hisMaxSets);
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #2: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                        } else {
                                                                          //  console.log("DEBUG#RETURN");
                                                                            break firstLoop;
                                                                        }
                                                                    }
                                                                }
                                                                if (hisMaxSets > 0) {
                                                                    client.chatMessage(SENDER, "✖ There are not enough sets. Please try again later.");
                                                                } else {
	
																	if(temp < amountofsets){
																	client.chatMessage(SENDER,"✔ We can only send you "+(temp)+" Card Sets right now (Your Credits After This Trade: " +(amountofsets-temp)+")");
																	console.log("!Collect "+hisMaxSets+ " - SENT");
																	} else {
																		client.chatMessage(SENDER,"Sending you "+(amountofsets)+" Card Sets (Credits After This Trade: " +(amountofsets-amountofsets)+")");
																		console.log("!Collect "+hisMaxSets+ " - SENT");
																	}
																	client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
																	
                                                                    setsThatShouldntBeSent.push(t.itemsToGive);
																	t.setMessage("Your Sets Are Ready! Enjoy your Level Ups! :) (!Collect)");
                                                                    t.send((ERR, STATUS) => {
                                                                        if (ERR) {
                                                                            client.chatMessage(SENDER, "✖ I'm Refreshing my inventory! Please try again in a few seconds.");
                                                                            console.log("## An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            
																			TotalSetsSold.Users[SENDER.getSteamID64()].Credits -= Math.min(temp,amountofsets);
																			require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(TotalSetsSold, undefined, "\t"));
                                                                            console.log("[!Collect] Trade offer sent");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
	
															client.chatMessage(SENDER, "✖ Sorry, I don't have enough Sets right now: "+hisMaxSets+" / "+amountofsets+", I'll restock soon!");
                                                        }
                                                        
                                                    } else {
                                                        console.log("An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    client.chatMessage(SENDER, "✖ An error occurred while getting your badges. Please try again.");
                                                    console.log(SENDER, "## An error occurred while loading badges: " + ERR);
                                                }
                                            });

                        } else {
                            client.chatMessage(SENDER, "✖ Please make sure you don't have a trade hold!");
                        }
                    });
			} else {
                client.chatMessage(SENDER, "✖ You don't have enough Credits to collect Sets: ["+n+" / 1]\r\nUse !Deposit to see how you can get more Credits");
				}
            
			} else {
				client.chatMessage(SENDER,"You don't have any credits to buy sets with. Use !Deposit to see how it works");
			}			
			
        } else {
            client.chatMessage(SENDER, "✖ Please try again later.");
        }
	
    } // !collect ends
	else if (MSG.toUpperCase().indexOf("!SET4CARDS") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!SET4CARDS ", ""),
                amountofsets = parseInt(n);
			let PriceInCards = n*CONFIG.Rates.Set4Cards_Rate; 
			let theirCards = [];
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= 100) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            console.log("## An error occurred while getting trade holds: " + ERR);
                            client.chatMessage(SENDER, "[Error]  An error occurred while getting your trade holds. Please try again");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) { 
                            n = parseInt(n); 
							
							client.chatMessage(SENDER,"You Requested To Buy " +n+" Card Sets for "+PriceInCards +" of your Random Cards!");
							sleep(1500);
							client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), 753, 6, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    console.log("## An error occurred while getting inventory: " + ERR);
                                    client.chatMessage(SENDER, "[Error]  An error occurred while loading your inventory. Please try later");
                                } else {
                                    if (!ERR) {
                                        
										////////////////////////////////////////////
									GetInv();
										for(var i=0;i<INV.length; i++){
											let ThierItem = INV[i]; 
											let tag = ThierItem.type; 
											if(tag.includes("Trading Card")){ 
												if(theirCards.length <PriceInCards){ 
													theirCards.push(ThierItem);
												} else{ 
													break;
												}
											}
										}
									if(theirCards.length == PriceInCards){

											
                                            Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
                                                if (!ERR) {
                                                    
                                                    if (!ERR) {
                                                        let b = {}; 
                                                        if (DATA) {
                                                            for (let i = 0; i < Object.keys(DATA).length; i++) {
                                                                if (DATA[Object.keys(DATA)[i]] < 6) {
                                                                    b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                                                                }
                                                            }
                                                        } else {
                                                            client.chatMessage(SENDER.getSteamID64(), "[Error]  Your badges are empty, sending an offer without checking badges.");
                                                        }
                                                      
                                                        let hisMaxSets = 0,
                                                            botNSets = 0;
                                                       
                                                        for (let i = 0; i < Object.keys(b).length; i++) {
                                                            if (botSets[Object.keys(b)[i]] && botSets[Object.keys(b)[i]].length >= 5 - b[Object.keys(b)[i]].length) {
                                                                hisMaxSets += 5 - b[Object.keys(b)[i]].length;
                                                            }
                                                        }
                                                      
                                                        for (let i = 0; i < Object.keys(botSets).length; i++) {
                                                            if (Object.keys(b).indexOf(Object.keys(botSets)[i]) < 0) {
                                                                if (botSets[Object.keys(botSets)[i]].length >= 5) {
                                                                    hisMaxSets += 5;
                                                                } else {
                                                                    hisMaxSets += botSets[Object.keys(botSets)[i]].length;
                                                                }
                                                            }
                                                            botNSets += botSets[Object.keys(botSets)[i]].length;
                                                        }
                                                     
                                                        if (amountofsets <= hisMaxSets) {
                                                            hisMaxSets = amountofsets;
                                                           
                                                            sortSetsByAmount(botSets, (DATA) => {
                                                               
                                                                firstLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    if (b[DATA[i]] == 0) {
                                                                        continue firstLoop;
                                                                    } else {
                                                                      
                                                                        if (hisMaxSets > 0) {
                                                                           
                                                                            if (b[DATA[i]] && botSets[DATA[i]].length >= b[DATA[i]]) {
                                                                              
                                                                                sLoop: for (let j = 0; j < 5 - b[DATA[i]]; j++) {
                                                                                    if (j + 1 < b[DATA[i]] && hisMaxSets > 0) {
                                                                                       
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        hisMaxSets--;
                                                                                     
                                                                                    } else {
                                                                                        
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else if (b[DATA[i]] && botSets[DATA[i]].length < b[DATA[i]]) {
                                                                              
                                                                                continue; // *
                                                                            } else if (!b[DATA[i]] && botSets[DATA[i]].length < 5 && botSets[DATA[i]].length - b[DATA[i]] > 0) { // TODO NOT FOR LOOP WITH BOTSETS. IT SENDS ALL
                                                                                
                                                                                bLoop: for (let j = 0; j < botSets[DATA[i]].length - b[DATA[i]]; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                      
                                                                                        hisMaxSets--;
                                                                                    } else {
                                                                                        
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                            else if (hisMaxSets < 5) {
                                                                              
                                                                                tLoop: for (let j = 0; j != hisMaxSets; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                      
                                                                                        hisMaxSets--;
                                                                                      
                                                                                    } else {
                                                                                       
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else {
                                                                               
                                                                                xLoop: for (let j = 0; j != 5; j++ && hisMaxSets > 0) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                       
                                                                                        hisMaxSets--;
                                                                                        
                                                                                    } else {
                                                                                       
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                        } else {
                                                                           
                                                                            break firstLoop;
                                                                        }
                                                                    }
                                                                }
                                                                if (hisMaxSets > 0) {
                                                                    client.chatMessage(SENDER, "[Error]  There are not enough sets. Please try again later.");
                                                                } else {
                                                                   
                                                                    t.addTheirItems(theirCards);
                                                                    t.data("commandused", "Set4Cards");
																	console.log("!Set4Cards "+n+ " - SENT");
                                                                    t.data("amountofkeys", n);
                                                                    t.data("amountofsets", amountofsets.toString());
                                                                    t.data("index", setsThatShouldntBeSent.length);
                                                                    setsThatShouldntBeSent.push(t.itemsToGive);
																	t.setMessage("Your Sets Are Ready! Enjoy your Level Ups! :)");
                                                                    t.send((ERR, STATUS) => {
                                                                        if (ERR) {
                                                                            client.chatMessage(SENDER, "[Error]  I'm Refreshing my inventory! Please try again in a few seconds.");
                                                                            console.log("## An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            //client.chatMessage(SENDER, " Trade Sent! Confirming it...");
                                                                            console.log("["+getTime()+"] [Set4Cards] Trade Offer Sent");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            client.chatMessage(SENDER, "[Error]  Sorry, I don't have enough Sets which you haven't crafted. I'll restock soon!");
                                                        }
                                                        // TO HERE
                                                    } else {
                                                        console.log("An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    client.chatMessage(SENDER, "[Error]  An error occurred while getting your badges. Please try again.");
                                                    console.log(SENDER, "## An error occurred while loading badges: " + ERR);
                                                }
                                            });
										} else{
											client.chatMessage(SENDER, ":reddanger: You don't have enough Trading Cards to make this trade! "+theirCards.length+" / "+PriceInCards);
										}	
                                    }
									else {
                                        console.log("## An error occurred while getting inventory: " + ERR);
                                        client.chatMessage(SENDER, "[Error]  An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            }); // User's inv load ends
                        } else {
                            client.chatMessage(SENDER, "[Error]  Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    client.chatMessage(SENDER, "[Error]  You can only buy 100 Sets at a time with this command!");
                }
            } else {
                client.chatMessage(SENDER, "[Error]  Please provide a valid amount of sets -> !Set4Cards <Number of sets>");
            }
        } else {
            client.chatMessage(SENDER, "[Error]  Please try again later.");
        }
    } 
	else if (MSG.toUpperCase().indexOf("!HYDRA") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!HYDRA ", ""),
                amountofsets = Math.floor(parseInt(n) * CONFIG.Rates.Hydra_Rate);
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MESSAGES.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            console.log("## An error occurred while getting trade holds: " + ERR);
                            client.chatMessage(SENDER, "[Error] An error occurred while getting your trade holds. Please Enable your Steam Guard!");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            n = parseInt(n);
                            let theirKeys = [];
							client.chatMessage(SENDER,"You Requested To Buy "+amountofsets+" Card Sets with "+n +" Hydra Keys!");
							sleep(1500);
							client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), 730, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    console.log("## An error occurred while getting inventory: " + ERR);
                                    client.chatMessage(SENDER, "[Error] An error occurred while loading your inventory. Is it private?");
                                } else {
                                   // console.log("DEBUG#INV LOADED");
                                    if (!ERR) {
										
                                       // console.log("DEBUG#INV LOADED NOERR");
                                        for (let i = 0; i < INV.length; i++) {
                                            if (theirKeys.length < n && CONFIG.Hydra.indexOf(INV[i].market_hash_name) >= 0) {
                                                theirKeys.push(INV[i]);
                                            }
                                        }
										GetInv();
                                        if (theirKeys.length != n) {
                                           /*error*/ client.chatMessage(SENDER, "[Error] You don't have enough Hydra Keys: "+theirKeys.length+" / "+n);
													 console.log("[Hydra] Not enough Keys:" +theirKeys.length+" / "+n);
                                        } else {
                                            Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
                                                if (!ERR) {
                                                  //  console.log("DEBUG#BADGE LOADED");
                                                    if (!ERR) {
                                                        let b = {}; // List with badges that CAN still be crafted
                                                        if (DATA) {
                                                            for (let i = 0; i < Object.keys(DATA).length; i++) {
                                                                if (DATA[Object.keys(DATA)[i]] < 6) {
                                                                    b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                                                                }
                                                            }
                                                        } else {
                                                            client.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
                                                        }
                                               
                                                        let hisMaxSets = 0,
                                                            botNSets = 0;
                                                   
                                                        for (let i = 0; i < Object.keys(b).length; i++) {
                                                            if (botSets[Object.keys(b)[i]] && botSets[Object.keys(b)[i]].length >= 5 - b[Object.keys(b)[i]].length) {
                                                                hisMaxSets += 5 - b[Object.keys(b)[i]].length;
                                                            }
                                                        }
                                             
                                                        for (let i = 0; i < Object.keys(botSets).length; i++) {
                                                            if (Object.keys(b).indexOf(Object.keys(botSets)[i]) < 0) {
                                                                if (botSets[Object.keys(botSets)[i]].length >= 5) {
                                                                    hisMaxSets += 5;
                                                                } else {
                                                                    hisMaxSets += botSets[Object.keys(botSets)[i]].length;
                                                                }
                                                            }
                                                            botNSets += botSets[Object.keys(botSets)[i]].length;
                                                        }
                                                   
                                                        if (amountofsets <= hisMaxSets) {
                                                            hisMaxSets = amountofsets;
                                                          //  console.log("DEBUG#TRADE CREATED");
                                                            sortSetsByAmount(botSets, (DATA) => {
                                                              //  console.log("DEBUG#" + DATA);
                                                               // console.log("DEBUG#SETS SORTED");
                                                                firstLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    if (b[DATA[i]] == 0) {
                                                                        continue firstLoop;
                                                                    } else {
                                                                       // console.log("DEBUG#" + i);
                                                                      //  console.log("DEBUG#FOR LOOP ITEMS");
                                                                        if (hisMaxSets > 0) {
                                                                          //  console.log("DEBUG#MAXSETSMORETHAN1");
                                                                            if (b[DATA[i]] && botSets[DATA[i]].length >= b[DATA[i]]) {
                                                                                // BOT HAS ENOUGH SETS OF THIS KIND
                                                                             //   console.log("DEBUG#LOOP #1");
                                                                                sLoop: for (let j = 0; j < 5 - b[DATA[i]]; j++) {
                                                                                    if (j + 1 < b[DATA[i]] && hisMaxSets > 0) {
                                                                                     //   console.log("DEBUG#LOOP #1: ITEM ADD");
                                                                                     //   console.log("DEBUG#LOOP #1: " + botSets[DATA[i]][j]);
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        hisMaxSets--;
                                                                                        console.log(hisMaxSets);
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #1: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else if (b[DATA[i]] && botSets[DATA[i]].length < b[DATA[i]]) {
                                                                                // BOT DOESNT HAVE ENOUGH SETS OF THIS KIND
                                                                               // console.log("DEBUG#LOOP #1 CONTINUE");
                                                                                continue; // *
                                                                            } else if (!b[DATA[i]] && botSets[DATA[i]].length < 5 && botSets[DATA[i]].length - b[DATA[i]] > 0) { // TODO NOT FOR LOOP WITH BOTSETS. IT SENDS ALL
                                                                                // BOT HAS ENOUGH SETS AND USER NEVER CRAFTED THIS
                                                                                bLoop: for (let j = 0; j < botSets[DATA[i]].length - b[DATA[i]]; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                       // console.log("DEBUG#LOOP #2 CONTINUE: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                            else if (hisMaxSets < 5) {
                                                                                // BOT DOESNT HAVE CARDS USER AREADY CRAFTED, IF USER STILL NEEDS 5 SETS:
                                                                               // console.log("DEBUG#LOOP #2");
                                                                                tLoop: for (let j = 0; j != hisMaxSets; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                      //  console.log("DEBUG#LOOP #2: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                     //   console.log(hisMaxSets);
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #2: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                // BOT DOESNT HAVE CARDS USER AREADY CRAFTED, IF USER STILL NEEDS LESS THAN 5 SETS:
                                                                               // console.log("DEBUG#LOOP #2");
                                                                                xLoop: for (let j = 0; j != 5; j++ && hisMaxSets > 0) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                       // console.log("DEBUG#LOOP #2: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                      //  console.log(hisMaxSets);
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #2: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                        } else {
                                                                          //  console.log("DEBUG#RETURN");
                                                                            break firstLoop;
                                                                        }
                                                                    }
                                                                }
                                                                if (hisMaxSets > 0) {
                                                                    client.chatMessage(SENDER, "[Error] There are not enough sets. Please try again later.");
                                                                } else {
                                                                  //  console.log("DEBUG#SENDING");
                                                                    t.addTheirItems(theirKeys);
                                                                    t.data("commandused", "Hydra");
																	console.log("!Hydra "+n+ " - SENT");
                                                                    t.data("amountofkeys", n);
                                                                    t.data("amountofsets", amountofsets.toString());
                                                                    t.data("index", setsThatShouldntBeSent.length);
                                                                    setsThatShouldntBeSent.push(t.itemsToGive);
																	t.setMessage("Your Sets Are Ready! Enjoy your Level Ups! :) (!hydra)");
                                                                    t.send((ERR, STATUS) => {
                                                                        if (ERR) {
                                                                            client.chatMessage(SENDER, "[Error] I'm Refreshing my inventory! Please try again in a few seconds.");
                                                                            console.log("## An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            client.chatMessage(SENDER, " Trade Sent! Confirming it...");
                                                                            console.log("[!Hydra] Trade offer sent");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
															if(hisMaxSets >=CONFIG.Rates.Hydra_Rate){
                                                            client.chatMessage(SENDER, "[Error] Sorry, I don't have enough Sets right now for this amount of Keys! I'll restock soon! \r\n  Try using !Hydra "+Math.floor(hisMaxSets/CONFIG.Rates.Hydra_Rate));
															}
															else{
																client.chatMessage(SENDER, "[Error] Sorry, I don't have enough Sets right now: "+hisMaxSets+" / "+amountofsets);
															}
                                                        }
                                                        // TO HERE
                                                    } else {
                                                        console.log("An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    client.chatMessage(SENDER, "[Error] An error occurred while getting your badges. Please try again.");
                                                    console.log(SENDER, "## An error occurred while loading badges: " + ERR);
                                                }
                                            });
                                        }
                                    } else {
                                        console.log("## An error occurred while getting inventory: " + ERR);
                                        client.chatMessage(SENDER, "[Error] An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            });
                        } else {
                            client.chatMessage(SENDER, "[Error] Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    client.chatMessage(SENDER, "[Error] You can only buy Sets with "+CONFIG.MESSAGES.MAX_HYDRA + " Hydra Keys at a time!");
                }
            } else {
                client.chatMessage(SENDER, "[Error] Please provide a valid amount of Hydra keys -> !Hydra <Number of Hydra keys>");
            }
        } else {
            client.chatMessage(SENDER, "[Error] Please try again later.");
        }
    } 
	else if (MSG.toUpperCase().indexOf("!BUYANY") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYANY ", ""),
                amountofsets = parseInt(n) * CONFIG.Rates.TF2_Buy;
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MESSAGES.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    n = parseInt(n);
                    let theirKeys = [];
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            console.log("## An error occurred while getting trade holds: " + ERR);
                            client.chatMessage(SENDER, "✖ An error occurred while getting your trade holds. Please Enable your Steam Guard!");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            client.chatMessage(SENDER,"You Requested To Buy "+amountofsets+" Card Sets (any) with "+n +" TF2 Keys! ("+CONFIG.Rates.TF2_Buy+":1 Rate) ");
							sleep(1500);
							client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    console.log("## An error occurred while getting inventory: " + ERR);
                                    client.chatMessage(SENDER, "✖ An error occurred while loading your inventory. Is it private?");
                                } else {
                                    let amountofB = amountofsets;
									GetInv();
                                    for (let i = 0; i < INV.length; i++) {
                                        if (theirKeys.length < n && CONFIG.ACCEPTEDKEYS.indexOf(INV[i].market_hash_name) >= 0) {
                                            theirKeys.push(INV[i]);
                                        }
                                    }
                                    if (theirKeys.length != n) {
                                       /*error*/ client.chatMessage(SENDER, "✖ You don't have enough TF2 keys: "+theirKeys.length+" / "+n+" or they're not Tradeable Yet. \r\n★ Tip: We also Give Sets for Backgrounds, Emotes, Gems. Use !help to see how it works.");
									   //// Adding bot's sets
                                    } else {
                                        sortSetsByAmount(botSets, (DATA) => {
                                            let setsSent = {};
                                            firstLoop: for (let i = 0; i < DATA.length; i++) {
                                               // console.log(setsSent);
                                               // console.log(DATA[i]);
                                                if (botSets[DATA[i]]) {
                                                    for (let j = 0; j < botSets[DATA[i]].length; j++) {
                                                        if (amountofB > 0) {
                                                            if ((setsSent[DATA[i]] && setsSent[DATA[i]] > -1) || !setsSent[DATA[i]]) {
                                                                t.addMyItems(botSets[DATA[i]][j]);
                                                               // console.log("DEBUG#LOOP #2 CONTINUE: ITEM ADD");
                                                                amountofB--;
                                                                if (!setsSent[DATA[i]]) {
                                                                    setsSent[DATA[i]] = 1;
                                                                } else {
                                                                    setsSent[DATA[i]] += 1;
                                                                }
                                                            } else {
                                                               // console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                continue firstLoop;
                                                            }
                                                        } else {
                                                          //  console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                            continue firstLoop;
                                                        }
                                                    }
                                                } else {
                                                   // console.log("DEBUG#LOOP #2 CONTINUE: RETURN 2");
                                                    continue firstLoop;
                                                }
                                            }
                                        });
                                    if (amountofB > 0) {
                                        client.chatMessage(SENDER, "✖ There are not enough sets. Please try again later.");
                                    } else {
                                       // console.log("DEBUG#SENDING");
                                        t.addTheirItems(theirKeys);
                                        t.data("commandused", "BuyAny");
										console.log("!BuyAny "+n+ " - SENT");
                                        t.data("amountofsets", amountofsets.toString());
                                        t.data("amountofkeys", n);
                                        t.data("index", setsThatShouldntBeSent.length);
                                        setsThatShouldntBeSent.push(t.itemsToGive);
										t.setMessage("Your Sets Are Ready! Enjoy your Level Ups! :) (!buyany)");
                                        t.send((ERR, STATUS) => {
                                            if (ERR) {
                                                client.chatMessage(SENDER, "✖ I'm Refreshing my inventory! Please try again in a few seconds.");
                                                console.log("## An error occurred while sending trade: " + ERR);
                                            } else {
                                                
                                                console.log("["+getTime()+"] [!BuyAny] Trade Offer Sent!");
                                            }
                                        });
                                    }
									}
                                }//
                            });
                        } else {
                            client.chatMessage(SENDER, "✖ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    client.chatMessage(SENDER, "✖ You can only buy Sets with "+CONFIG.MESSAGES.MAXBUY + " Keys at a time!");
                }
            } else {
                client.chatMessage(SENDER, "✖ Invalid amount of keys Use: !Buyany [Amount of keys]");
            }
        } else {
            client.chatMessage(SENDER, "✖ Please try again later.");
        }
    }
	// !buyany ends
	else if (MSG.toUpperCase().indexOf("!BUYTF") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYTF ", ""),
                amountofsets = parseInt(n) * CONFIG.Rates.TF2_Buy;
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MESSAGES.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            console.log("## An error occurred while getting trade holds: " + ERR);
                            client.chatMessage(SENDER, "✖ An error occurred while getting your trade holds. Please Enable your Steam Guard!");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            n = parseInt(n);
                            let theirKeys = [];
							client.chatMessage(SENDER,"You Requested To Buy "+amountofsets+" Card Sets with "+n +" TF2 Keys! ("+CONFIG.Rates.TF2_Buy+":1 Rate) ");
							sleep(1500);
							client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    console.log("## An error occurred while getting inventory: " + ERR);
                                    client.chatMessage(SENDER, "✖ An error occurred while loading your inventory. Is it private?");
                                } else {
									GetInv();
                                   // console.log("DEBUG#INV LOADED");
                                    if (!ERR) {
                                       // console.log("DEBUG#INV LOADED NOERR");
                                        for (let i = 0; i < INV.length; i++) {
                                            if (theirKeys.length < n && CONFIG.ACCEPTEDKEYS.indexOf(INV[i].market_hash_name) >= 0) {
                                                theirKeys.push(INV[i]);
                                            }
                                        }
                                        if (theirKeys.length != n) {
                                           /*error*/ client.chatMessage(SENDER, "✖ You don't have enough keys: "+theirKeys.length+ " / "+n+" or they're not Tradeable Yet.\r\n★ Tip: We also Give sets for Backgrounds, Emotes, Gems. Use !help to see how it works.");
													 console.log("[BuyTF] Not enough Keys:" +theirKeys.length+" / "+n);
                                        } else {
                                            Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
                                                if (!ERR) {
                                                  //  console.log("DEBUG#BADGE LOADED");
                                                    if (!ERR) {
                                                        let b = {}; // List with badges that CAN still be crafted
                                                        if (DATA) {
                                                            for (let i = 0; i < Object.keys(DATA).length; i++) {
                                                                if (DATA[Object.keys(DATA)[i]] < 6) {
                                                                    b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                                                                }
                                                            }
                                                        } else {
                                                            client.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
                                                        }
                                                       
                                                        let hisMaxSets = 0,
                                                            botNSets = 0;
                                                        // Loop for sets he has partially completed
                                                        for (let i = 0; i < Object.keys(b).length; i++) {
                                                            if (botSets[Object.keys(b)[i]] && botSets[Object.keys(b)[i]].length >= 5 - b[Object.keys(b)[i]].length) {
                                                                hisMaxSets += 5 - b[Object.keys(b)[i]].length;
                                                            }
                                                        }
                                                      //  console.log("DEBUG#LOOP 1 DONE");
                                                        // Loop for sets he has never crafted
                                                        for (let i = 0; i < Object.keys(botSets).length; i++) {
                                                            if (Object.keys(b).indexOf(Object.keys(botSets)[i]) < 0) {
                                                                if (botSets[Object.keys(botSets)[i]].length >= 5) {
                                                                    hisMaxSets += 5;
                                                                } else {
                                                                    hisMaxSets += botSets[Object.keys(botSets)[i]].length;
                                                                }
                                                            }
                                                            botNSets += botSets[Object.keys(botSets)[i]].length;
                                                        }
                                                     //   console.log("DEBUG#LOOP 2 DONE");
                                                        // HERE
                                                        if (amountofsets <= hisMaxSets) {
                                                            hisMaxSets = amountofsets;
                                                          //  console.log("DEBUG#TRADE CREATED");
                                                            sortSetsByAmount(botSets, (DATA) => {
                                                              //  console.log("DEBUG#" + DATA);
                                                               // console.log("DEBUG#SETS SORTED");
                                                                firstLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    if (b[DATA[i]] == 0) {
                                                                        continue firstLoop;
                                                                    } else {
                                                                       // console.log("DEBUG#" + i);
                                                                      //  console.log("DEBUG#FOR LOOP ITEMS");
                                                                        if (hisMaxSets > 0) {
                                                                          //  console.log("DEBUG#MAXSETSMORETHAN1");
                                                                            if (b[DATA[i]] && botSets[DATA[i]].length >= b[DATA[i]]) {
                                                                                // BOT HAS ENOUGH SETS OF THIS KIND
                                                                             //   console.log("DEBUG#LOOP #1");
                                                                                sLoop: for (let j = 0; j < 5 - b[DATA[i]]; j++) {
                                                                                    if (j + 1 < b[DATA[i]] && hisMaxSets > 0) {
                                                                                     //   console.log("DEBUG#LOOP #1: ITEM ADD");
                                                                                     //   console.log("DEBUG#LOOP #1: " + botSets[DATA[i]][j]);
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        hisMaxSets--;
                                                                                        
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #1: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else if (b[DATA[i]] && botSets[DATA[i]].length < b[DATA[i]]) {
                                                                                // BOT DOESNT HAVE ENOUGH SETS OF THIS KIND
                                                                               // console.log("DEBUG#LOOP #1 CONTINUE");
                                                                                continue; // *
                                                                            } else if (!b[DATA[i]] && botSets[DATA[i]].length < 5 && botSets[DATA[i]].length - b[DATA[i]] > 0) { // TODO NOT FOR LOOP WITH BOTSETS. IT SENDS ALL
                                                                                // BOT HAS ENOUGH SETS AND USER NEVER CRAFTED THIS
                                                                                bLoop: for (let j = 0; j < botSets[DATA[i]].length - b[DATA[i]]; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                       // console.log("DEBUG#LOOP #2 CONTINUE: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                            else if (hisMaxSets < 5) {
                                                                                // BOT DOESNT HAVE CARDS USER AREADY CRAFTED, IF USER STILL NEEDS 5 SETS:
                                                                               // console.log("DEBUG#LOOP #2");
                                                                                tLoop: for (let j = 0; j != hisMaxSets; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                      //  console.log("DEBUG#LOOP #2: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                     //   console.log(hisMaxSets);
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #2: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                // BOT DOESNT HAVE CARDS USER AREADY CRAFTED, IF USER STILL NEEDS LESS THAN 5 SETS:
                                                                               // console.log("DEBUG#LOOP #2");
                                                                                xLoop: for (let j = 0; j != 5; j++ && hisMaxSets > 0) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                       // console.log("DEBUG#LOOP #2: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                      //  console.log(hisMaxSets);
                                                                                    } else {
                                                                                      //  console.log("DEBUG#LOOP #2: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                        } else {
                                                                          //  console.log("DEBUG#RETURN");
                                                                            break firstLoop;
                                                                        }
                                                                    }
                                                                }
                                                                if (hisMaxSets > 0) {
                                                                    client.chatMessage(SENDER, "✖ There are not enough sets. Please try again later.");
                                                                } else {
                                                                  //  console.log("DEBUG#SENDING");
                                                                    t.addTheirItems(theirKeys);
                                                                    t.data("commandused", "BuyTF");
																	console.log("!BuyTF "+n+ " - SENT");
                                                                    t.data("amountofkeys", n);
                                                                    t.data("amountofsets", amountofsets.toString());
                                                                    t.data("index", setsThatShouldntBeSent.length);
                                                                    setsThatShouldntBeSent.push(t.itemsToGive);
																	t.setMessage("Your Sets Are Ready! Enjoy your Level Ups! :) (!buytf)");
                                                                    t.send((ERR, STATUS) => {
                                                                        if (ERR) {
                                                                            client.chatMessage(SENDER, "✖ I'm Refreshing my inventory! Please try again in a few seconds.");
                                                                            console.log("## An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            
                                                                            console.log("[!BuyTF] Trade offer sent");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
															if(hisMaxSets >=CONFIG.Rates.TF2_Buy){
                                                            client.chatMessage(SENDER, "✖ Sorry, I don't have enough Sets right now for this amount of Keys! I'll restock soon! \r\n ★ Try using !BuyTF "+Math.floor(hisMaxSets/CONFIG.Rates.TF2_Buy));
															}
															else{
																client.chatMessage(SENDER, "✖ Sorry, I don't have enough Sets right now: "+hisMaxSets+" / "+amountofsets+", I'll restock soon! \r\n ★ Try using other buying methods like !Gem4Set or !Crap4Sets");
															}
                                                        }
                                                        // TO HERE
                                                    } else {
                                                        console.log("An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    client.chatMessage(SENDER, "✖ An error occurred while getting your badges. Please try again.");
                                                    console.log(SENDER, "## An error occurred while loading badges: " + ERR);
                                                }
                                            });
                                        }
                                    } else {
                                        console.log("## An error occurred while getting inventory: " + ERR);
                                        client.chatMessage(SENDER, "✖ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            });
                        } else {
                            client.chatMessage(SENDER, "✖ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    client.chatMessage(SENDER, "✖ You can only buy Sets with "+CONFIG.MESSAGES.MAXBUY + " Keys at a time!");
                }
            } else {
                client.chatMessage(SENDER, "✖ Invalid amount of keys Use: !BuyTF [Amount of keys]");
            }
        } else {
            client.chatMessage(SENDER, "✖ Please try again later.");
        }
    } 
	else if (MSG.toUpperCase().indexOf("!GEM4SET") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!GEM4SET ", ""),
                amountofsets = parseInt(n),TotalGemsPaid =0;
			let PriceInGems = n*CONFIG.Rates.Gem_Buy;
			let Original_Price = PriceInGems;

            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= 100) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            console.log("## An error occurred while getting trade holds: " + ERR);
                            client.chatMessage(SENDER, "✖ An error occurred while getting your trade holds. Please Enable your Steam Guard!");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) { 
                            n = parseInt(n); 
                            let theirKeys = [];
							
							client.chatMessage(SENDER,"You Requested To Buy " +n+" Card Sets for "+Original_Price +" Gems! ✔");
							sleep(1500);
							client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), 753, 6, true, (ERR, INV, CURR) => { //Load user's Steam INV
                                if (ERR) {
                                    console.log("## An error occurred while getting inventory: " + ERR);
                                    client.chatMessage(SENDER, "✖ An error occurred while loading your inventory. Please try later");
                                } else {
                                    if (!ERR) {
										let TheirGems = INV.filter(gem => gem.name == "Gems"); 
										GetInv();
										if (TheirGems === undefined || TheirGems.length == 0){ 
										console.log("["+getTime()+"] " +"✖[GEM4SET] Gems = Null. Declining..");
										client.chatMessage(SENDER, "✖ You don't have any Gems to make this trade: 0 / "+PriceInGems+" \r\n ★ Tip: You can get Gems by converting your Backgrounds/Emotes!");
										console.log("[Gem_Buys] Not enough Gems");
										return;
										} else { 
											let gem = TheirGems[0];
											let gemDifference = PriceInGems - gem.amount;
											
									if(gemDifference <=0){ 
										gem.amount = PriceInGems;
										t.addTheirItem(gem); 
										
										
										
                                            Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
                                                if (!ERR) {
                                                   
                                                    if (!ERR) {
                                                        let b = {};
                                                        if (DATA) {
                                                            for (let i = 0; i < Object.keys(DATA).length; i++) {
                                                                if (DATA[Object.keys(DATA)[i]] < 6) {
                                                                    b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                                                                }
                                                            }
                                                        } else {
                                                            client.chatMessage(SENDER.getSteamID64(), "✖ Your badges are empty, sending an offer without checking badges.");
                                                        }
                                                      
                                                        let hisMaxSets = 0,
                                                            botNSets = 0;
                                                        
                                                        for (let i = 0; i < Object.keys(b).length; i++) {
                                                            if (botSets[Object.keys(b)[i]] && botSets[Object.keys(b)[i]].length >= 5 - b[Object.keys(b)[i]].length) {
                                                                hisMaxSets += 5 - b[Object.keys(b)[i]].length;
                                                            }
                                                        }
                                                       
                                                        for (let i = 0; i < Object.keys(botSets).length; i++) {
                                                            if (Object.keys(b).indexOf(Object.keys(botSets)[i]) < 0) {
                                                                if (botSets[Object.keys(botSets)[i]].length >= 5) {
                                                                    hisMaxSets += 5;
                                                                } else {
                                                                    hisMaxSets += botSets[Object.keys(botSets)[i]].length;
                                                                }
                                                            }
                                                            botNSets += botSets[Object.keys(botSets)[i]].length;
                                                        }
                                                      
                                                        if (amountofsets <= hisMaxSets) {
                                                            hisMaxSets = amountofsets;
                                                           
                                                            sortSetsByAmount(botSets, (DATA) => {
                                                               
                                                                firstLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    if (b[DATA[i]] == 0) {
                                                                        continue firstLoop;
                                                                    } else {
                                                                      
                                                                        if (hisMaxSets > 0) {
                                                                            
                                                                            if (b[DATA[i]] && botSets[DATA[i]].length >= b[DATA[i]]) {
                                                                               
                                                                                sLoop: for (let j = 0; j < 5 - b[DATA[i]]; j++) {
                                                                                    if (j + 1 < b[DATA[i]] && hisMaxSets > 0) {
                                                                                       
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        hisMaxSets--;
                                                                                        
                                                                                    } else {
                                                                                       
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else if (b[DATA[i]] && botSets[DATA[i]].length < b[DATA[i]]) {
                                                                               
                                                                                continue;
                                                                            } else if (!b[DATA[i]] && botSets[DATA[i]].length < 5 && botSets[DATA[i]].length - b[DATA[i]] > 0) { // TODO NOT FOR LOOP WITH BOTSETS. IT SENDS ALL
                                                                               
                                                                                bLoop: for (let j = 0; j < botSets[DATA[i]].length - b[DATA[i]]; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        
                                                                                        hisMaxSets--;
                                                                                    } else {
                                                                                    
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                            else if (hisMaxSets < 5) {
                                                                               
                                                                                tLoop: for (let j = 0; j != hisMaxSets; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                       
                                                                                        hisMaxSets--;
                                                                                       
                                                                                    } else {
                                                                                        
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else {
                                                                               
                                                                                xLoop: for (let j = 0; j != 5; j++ && hisMaxSets > 0) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                       
                                                                                        hisMaxSets--;
                                                                                      
                                                                                    } else {
                                                                                        
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                        } else {
                                                                           
                                                                            break firstLoop;
                                                                        }
                                                                    }
                                                                }
                                                                if (hisMaxSets > 0) {
                                                                    client.chatMessage(SENDER, "✖ There are not enough sets. Please try again later.");
                                                                } else {
                                                                    
                                                                    t.data("commandused", "Gem4Set");
																	console.log("!Gem4Set "+n+ " - SENT");
                                                                    t.data("amountofkeys", n);
                                                                    t.data("amountofsets", amountofsets.toString());
                                                                    t.data("index", setsThatShouldntBeSent.length);
                                                                    setsThatShouldntBeSent.push(t.itemsToGive);
																	t.setMessage("Your Sets Are Ready! Enjoy your Level Ups! :) (!Gem4Set)");
                                                                    t.send((ERR, STATUS) => {
                                                                        if (ERR) {
                                                                            client.chatMessage(SENDER, "✖ I'm Refreshing my inventory! Please try again in a few seconds.");
                                                                            console.log("## An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            //
                                                                            console.log("["+getTime()+"] [Gem_Buys] Trade Offer Sent");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            client.chatMessage(SENDER, "✖ Sorry, I don't have enough Sets which you haven't crafted. I'll restock soon!");
                                                        }
                                                       
                                                    } else {
                                                        console.log("An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    client.chatMessage(SENDER, "✖ An error occurred while getting your badges. Please try again.");
                                                    console.log(SENDER, "## An error occurred while loading badges: " + ERR);
                                                }
                                            });
										} else{
											if((Math.floor((gem.amount/(CONFIG.Rates.Gem_Buy)))) > 0){
											client.chatMessage(SENDER, "✖ You need "+gemDifference + " More Gems to make this trade! \r\n Try using: !Gem4Set "+Math.floor((gem.amount/(CONFIG.Rates.Gem_Buy))));
											}
											else{
												client.chatMessage(SENDER, "✖ You need "+gemDifference + " More Gems to make this trade!");
											}
										}	
									}//	
                                    }
									else {
                                        console.log("## An error occurred while getting inventory: " + ERR);
                                        client.chatMessage(SENDER, "✖ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            }); 
                        } else {
                            client.chatMessage(SENDER, "✖ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    client.chatMessage(SENDER, "✖ You can only buy 100 Sets at a time with this command!");
                }
            } else {
                client.chatMessage(SENDER, "✖ Invalid amount of sets Use: !Gem4Set [Amount]");
            }
        } else {
            client.chatMessage(SENDER, "✖ Please try again later.");
        }
    }
	else if (MSG.toUpperCase().indexOf("!CRAP4SETS") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!CRAP4SETS ", ""),
                amountofsets = parseInt(n); 
			let PriceInEmotesOrBackgrounds = n*(CONFIG.Rates.Gem_Buy/10); 
			let BackgroundsAndEmotes = []; 
			

			
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MESSAGES.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            console.log("## An error occurred while getting trade holds: " + ERR);
                            client.chatMessage(SENDER, "✖ An error occurred while getting your trade holds. Please Enable your Steam Guard!");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) { 
                            n = parseInt(n); 
                            let theirKeys = [];
							GetInv();
							client.chatMessage(SENDER,"You Requested To Buy " +n+" Card Sets for Backgrounds/Emotes!");
							sleep(1500);
							client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), 753, 6, true, (ERR, INV, CURR) => { //Load user's Steam INV
                                if (ERR) {
                                    console.log("## An error occurred while getting inventory: " + ERR);
                                    client.chatMessage(SENDER, "✖ An error occurred while loading your inventory. Please try later");
                                } else {
									let amountofB = amountofsets;
                                    if (!ERR) {
                                       
										for(var i=INV.length-1;i>0; i--){
											let ThierItem = INV[i]; 
											let tag = ThierItem.type; 
											if(tag.includes("Profile Background") || tag.includes("Emoticon")){ 
												if(!tag.includes("Event")){
													if(BackgroundsAndEmotes.length <PriceInEmotesOrBackgrounds){ 
														BackgroundsAndEmotes.push(ThierItem); 
													} else{ 
														break;
													}
												}
											}
										}
										
											if (BackgroundsAndEmotes.length < PriceInEmotesOrBackgrounds){
											console.log("["+getTime()+"] " +"✖[Crap4Sets] User doesnt have enough bg/emote: "+BackgroundsAndEmotes.length+" / "+PriceInEmotesOrBackgrounds);
												if(Math.floor((BackgroundsAndEmotes.length/(CONFIG.Rates.Gem_Buy/10))) >0){
											client.chatMessage(SENDER, "✖ You don't have enough Backgrounds/Emotes to make this trade! "+BackgroundsAndEmotes.length+" / "+PriceInEmotesOrBackgrounds+" \r\n\r\n ◆ Try using !Crap4Sets "+Math.floor((BackgroundsAndEmotes.length/((CONFIG.Rates.Gem_Buy/10)))));
												} else{
													client.chatMessage(SENDER, "✖ You don't have enough Backgrounds/Emotes to make this trade! "+BackgroundsAndEmotes.length+" / "+PriceInEmotesOrBackgrounds);
												}
											return;
											}
											
										else {
                                        sortSetsByAmount(botSets, (DATA) => {
                                            let setsSent = {};
                                            firstLoop: for (let i = 0; i < DATA.length; i++) {
                                              
                                                if (botSets[DATA[i]]) {
                                                    for (let j = 0; j < botSets[DATA[i]].length; j++) {
                                                        if (amountofB > 0) {
                                                            if ((setsSent[DATA[i]] && setsSent[DATA[i]] > -1) || !setsSent[DATA[i]]) {
                                                                t.addMyItems(botSets[DATA[i]][j]);
                                                               
                                                                amountofB--;
                                                                if (!setsSent[DATA[i]]) {
                                                                    setsSent[DATA[i]] = 1;
                                                                } else {
                                                                    setsSent[DATA[i]] += 1;
                                                                }
                                                            } else {
                                                             
                                                                continue firstLoop;
                                                            }
                                                        } else {
                                                        
                                                            continue firstLoop;
                                                        }
                                                    }
                                                } else {
                                                 
                                                    continue firstLoop;
                                                }
                                            }
                                        });
                                    if (amountofB > 0) {
                                        client.chatMessage(SENDER, "✖ There are not enough sets. Please try again later.");
                                    } else {
                                      
                                        t.addTheirItems(BackgroundsAndEmotes);
                                        t.data("commandused", "Crap4Sets");
										console.log("!Crap4Sets "+n+ " - SENT");
                                        t.data("amountofsets", amountofsets.toString());
                                        t.data("amountofkeys", n);
                                        t.data("index", setsThatShouldntBeSent.length);
                                        setsThatShouldntBeSent.push(t.itemsToGive);
										t.setMessage("Your Sets Are Ready! Enjoy your Level Ups! :) (!Crap4Sets)");
                                        t.send((ERR, STATUS) => {
                                            if (ERR) {
                                                client.chatMessage(SENDER, "✖ I'm Refreshing my inventory! Please try again in a few seconds.");
                                                console.log("## An error occurred while sending trade: " + ERR);
                                            } else {
                                                console.log("["+getTime()+"] [!Crap4Sets] Trade Offer Sent!");
                                            }
                                        });
                                    }
									}
                                    }//
									else {
                                        console.log("## An error occurred while getting inventory: " + ERR);
                                        client.chatMessage(SENDER, "✖ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            }); 
                        } else {
                            client.chatMessage(SENDER, "✖ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    client.chatMessage(SENDER, "✖ Please try an amount lower than "+CONFIG.MESSAGES.MAXBUY);
                }
            } else {
                client.chatMessage(SENDER, "✖ Invalid amount of sets Use: !Crap4Sets [Amount]");
            }
        } else {
            client.chatMessage(SENDER, "✖ Please try again later.");
        }
    } 
		else if (MSG.toUpperCase().indexOf("!SET4SET") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!SET4SET ", ""), 
                amountofsets = parseInt(n);
			let Overpay =0;
			let user = SENDER.getSteamID64();
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.Set4SetLimit) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            console.log("## An error occurred while getting trade holds: " + ERR);
                            client.chatMessage(SENDER, "✖ An error occurred while getting your trade holds. Please Enable your Steam Guard!");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) { // No trade hold, proceed with trade.
                            n = parseInt(n); 
                            let theirKeys = []; 
							//client.chatMessage(SENDER,"You Requested To Buy " +n+" Card Sets for Gems!");
							client.chatMessage(SENDER,"You Requested To Exchange "+n+" of your Sets for Brand new sets you haven't crafted yet!");
							sleep(1500);
							client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), 753, 6, true, (ERR, INV, CURR) => { //Load user's Steam INV
                                if (ERR) {
                                    console.log("## An error occurred while getting inventory: " + ERR);
                                    client.chatMessage(SENDER, "✖ An error occurred while loading your inventory. Please try later");
                                } else {
                                    if (!ERR) {
                                        // Adding their sets //
                                            let amountofB = amountofsets;
											GetInv();
                                            Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
                                                if (!ERR) {
                                                    let s = DATA;
                                                    Utils.getSets(s, allCards, (ERR, DDATA) => {
                                                        if (!ERR) {
                                                            sortSetsByAmount(s, (DATA) => {
                                                                let setsSent = {};
                                                                firsttLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    //console.log(setsSent);
                                                                   // console.log(DATA[i]);
                                                                    if (DDATA[DATA[i]]) {
                                                                        for (let j = 0; j < DDATA[DATA[i]].length; j++) {
                                                                            if (amountofB > 0) {
                                                                                if ((setsSent[DATA[i]] && setsSent[DATA[i]] < 5) || !setsSent[DATA[i]]) {
                                                                                    t.addTheirItems(DDATA[DATA[i]][j]);
                                                                                   // console.log("DEBUG#LOOP #2 CONTINUE: ITEM ADD");
                                                                                    amountofB--;
                                                                                    if (!setsSent[DATA[i]]) {
                                                                                        setsSent[DATA[i]] = 1;
                                                                                    } else {
                                                                                        setsSent[DATA[i]] += 1;
                                                                                    }
                                                                                } else {
                                                                                   // console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                    continue firsttLoop;
                                                                                }
                                                                            } else {
                                                                               // console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                continue firsttLoop;
                                                                            }
                                                                        }
                                                                    } else {
                                                                       // console.log("DEBUG#LOOP #2 CONTINUE: RETURN 2");
                                                                        continue firsttLoop;
                                                                    }
                                                                }
                                                            });
                                                            if (amountofB > 0) {
															  if(amountofsets-amountofB ==0){
                                                              /*error*/  client.chatMessage(SENDER, "✖ You do not have enough sets to make this trade: "+(amountofsets-amountofB)+" / "+n);
															  }
															  else{
																  /*error*/  client.chatMessage(SENDER, "✖ You do not have enough sets to make this trade: "+(amountofsets-amountofB)+" / "+n+" \r\n Try using !Set4Set "+(amountofsets-amountofB));
															  }
															  
															} 
															  else { //User's sets added, now add bot'ssets
														 Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
                                                if (!ERR) {
                                                    //console.log("DEBUG#BADGE LOADED");
                                                    if (!ERR) {
                                                        let b = {}; // List with badges that CAN still be crafted
                                                        if (DATA) {
                                                            for (let i = 0; i < Object.keys(DATA).length; i++) {
                                                                if (DATA[Object.keys(DATA)[i]] < 6) {
                                                                    b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                                                                }
                                                            }
                                                        } else {
                                                            client.chatMessage(SENDER.getSteamID64(), "✖ Your badges are empty, sending an offer without checking badges.");
                                                        }
                                                        //console.log(DATA);
                                                       // console.log(b);
                                                        // TODO: COUNT AMOUNT OF SETS BOT CAN GIVE HIM
                                                        // 1: GET BOTS CARDS. DONE
                                                        // 2: GET PLAYER's BADGES. DONE
                                                        // 3: MAGIC
                                                        let hisMaxSets = 0,
                                                            botNSets = 0;
                                                        // Loop for sets he has partially completed
                                                        for (let i = 0; i < Object.keys(b).length; i++) {
                                                            if (botSets[Object.keys(b)[i]] && botSets[Object.keys(b)[i]].length >= 5 - b[Object.keys(b)[i]].length) {
                                                                hisMaxSets += 5 - b[Object.keys(b)[i]].length;
                                                            }
                                                        }
                                                        //console.log("DEBUG#LOOP 1 DONE");
                                                        // Loop for sets he has never crafted
                                                        for (let i = 0; i < Object.keys(botSets).length; i++) {
                                                            if (Object.keys(b).indexOf(Object.keys(botSets)[i]) < 0) {
                                                                if (botSets[Object.keys(botSets)[i]].length >= 5) {
                                                                    hisMaxSets += 5;
                                                                } else {
                                                                    hisMaxSets += botSets[Object.keys(botSets)[i]].length;
                                                                }
                                                            }
                                                            botNSets += botSets[Object.keys(botSets)[i]].length;
                                                        }
                                                       // console.log("DEBUG#LOOP 2 DONE");
                                                        // HERE
                                                        if (amountofsets <= hisMaxSets) {
															
															
																hisMaxSets = amountofsets;
															
															/////////////////////////////
															// Change this line to change the overpay I get with !Set4Set
															/////////////////////////////////
                                                           
															
															
															
															
															
															
                                                            //console.log("DEBUG#TRADE CREATED");
                                                            sortSetsByAmount(botSets, (DATA) => {
                                                                //console.log("DEBUG#" + DATA);
                                                                //console.log("DEBUG#SETS SORTED");
                                                                firstLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    if (b[DATA[i]] == 0) {
                                                                        continue firstLoop;
                                                                    } else {
                                                                        //console.log("DEBUG#" + i);
                                                                        //console.log("DEBUG#FOR LOOP ITEMS");
                                                                        if (hisMaxSets > 0) {
                                                                            //console.log("DEBUG#MAXSETSMORETHAN1");
                                                                            if (b[DATA[i]] && botSets[DATA[i]].length >= b[DATA[i]]) {
                                                                                // BOT HAS ENOUGH SETS OF THIS KIND
                                                                                //console.log("DEBUG#LOOP #1");
                                                                                sLoop: for (let j = 0; j < 5 - b[DATA[i]]; j++) {
                                                                                    if (j + 1 < b[DATA[i]] && hisMaxSets > 0) {
                                                                                        //console.log("DEBUG#LOOP #1: ITEM ADD");
                                                                                        //console.log("DEBUG#LOOP #1: " + botSets[DATA[i]][j]);
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        hisMaxSets--;
                                                                                        //console.log(hisMaxSets);
                                                                                    } else {
                                                                                        //console.log("DEBUG#LOOP #1: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else if (b[DATA[i]] && botSets[DATA[i]].length < b[DATA[i]]) {
                                                                                // BOT DOESNT HAVE ENOUGH SETS OF THIS KIND
                                                                                //console.log("DEBUG#LOOP #1 CONTINUE");
                                                                                continue; // *
                                                                            } else if (!b[DATA[i]] && botSets[DATA[i]].length < 5 && botSets[DATA[i]].length - b[DATA[i]] > 0) { // TODO NOT FOR LOOP WITH BOTSETS. IT SENDS ALL
                                                                                // BOT HAS ENOUGH SETS AND USER NEVER CRAFTED THIS
                                                                                bLoop: for (let j = 0; j < botSets[DATA[i]].length - b[DATA[i]]; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        //console.log("DEBUG#LOOP #2 CONTINUE: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                    } else {
                                                                                        //console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                            else if (hisMaxSets < 5) {
                                                                                // BOT DOESNT HAVE CARDS USER AREADY CRAFTED, IF USER STILL NEEDS 5 SETS:
                                                                                //console.log("DEBUG#LOOP #2");
                                                                                tLoop: for (let j = 0; j != hisMaxSets; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                       // console.log("DEBUG#LOOP #2: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                       // console.log(hisMaxSets);
                                                                                    } else {
                                                                                        //console.log("DEBUG#LOOP #2: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                // BOT DOESNT HAVE CARDS USER AREADY CRAFTED, IF USER STILL NEEDS LESS THAN 5 SETS:
                                                                                //console.log("DEBUG#LOOP #2");
                                                                                xLoop: for (let j = 0; j != 5; j++ && hisMaxSets > 0) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        //console.log("DEBUG#LOOP #2: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                        //console.log(hisMaxSets);
                                                                                    } else {
                                                                                        //console.log("DEBUG#LOOP #2: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                        } else {
                                                                            //console.log("DEBUG#RETURN");
                                                                            break firstLoop;
                                                                        }
                                                                    }
                                                                }
                                                                if (hisMaxSets > 0) {
																  if(amountofsets-hisMaxSets ==0){
																  /*error*/  client.chatMessage(SENDER, "✖ Sorry, I only have "+(amountofsets-hisMaxSets)+" Sets which you can craft. I'll restock Very Soon!");
																  }
																  else{
																	  /*error*/  client.chatMessage(SENDER, "✖ Sorry, I only have "+(amountofsets-hisMaxSets)+" Sets which you can craft. \r\nTry using !Set4Set "+(amountofsets-hisMaxSets));
																  }
                                                                    
                                                                } else {
                                                                    //console.log("DEBUG#SENDING");
                                                                    //t.addTheirItems(theirKeys);
                                                                    t.data("commandused", "Set4Set");
																	console.log("!Set4Set "+n+ " - SENT");
                                                                    t.data("amountofkeys", n);
                                                                    t.data("amountofsets", amountofsets.toString());
                                                                    t.data("index", setsThatShouldntBeSent.length);
                                                                    setsThatShouldntBeSent.push(t.itemsToGive);
																	t.setMessage("✔ Your Sets Are Ready! Enjoy your Level Ups! :) (!Set4Set)");
                                                                    t.send((ERR, STATUS) => {
                                                                        if (ERR) {
                                                                            client.chatMessage(SENDER, "✖ I'm Refreshing my inventory! Please try again in a few seconds.");
                                                                            console.log("## An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            //client.chatMessage(SENDER, "✔ Trade Sent! Confirming it...");
                                                                            console.log("["+getTime()+"] [Set4Set] Trade Offer Sent");
                                                                        }
                                                                    });
                                                                }
                                                            });
														
                                                        } else {
                                                            client.chatMessage(SENDER, "✖ Sorry, I only have "+botNSets +" Sets to make this trade. I'll Restock Very Soon!\r\nFor now, Try using !Set4Set "+botNSets);
                                                        }
                                                        // TO HERE
                                                    } else {
                                                        console.log("An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    client.chatMessage(SENDER, "✖ An error occurred while getting your badges. Please try again.");
                                                    console.log(SENDER, "## An error occurred while loading badges: " + ERR);
                                                }
                                            });	
                                                } // Finished adding bot's sets, send offer	
                                                        } else {
                                                            console.log("## An error occurred while getting bot sets: " + ERR);
                                                        }
                                                    });
                                                } else {
                                                    console.log("## An error occurred while getting user inventory: " + ERR);
                                                }
                                            });									
                                    }
									else {
                                        console.log("## An error occurred while getting inventory: " + ERR);
                                        client.chatMessage(SENDER, "✖ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            }); 
                        } else {
                            client.chatMessage(SENDER, "✖ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    client.chatMessage(SENDER, "✖ You can only Exchange up to "+CONFIG.Set4SetLimit+" Sets at a time with this command!");
                }
            } else {
                client.chatMessage(SENDER, "✖ Invalid amount of sets Use: !Set4Set [Amount]");
            }
        } else {
            client.chatMessage(SENDER, "✖ Please try again later.");
        }
    } 
 
	else if (MSG.toUpperCase() == "!INFO") {
        client.chatMessage(SENDER, "About Us: \r\n  Owner: https://steamcommunity.com/profiles/"+CONFIG.Owner[1]);
    }
	else if (MSG.toUpperCase().indexOf("!FREE") >= 0) {
        if (botSets) {
			let n = MSG.toUpperCase().replace("!FREE ", ""),
            amountofsets = 1;
			if (!isNaN(n) && parseInt(n) > 0) {
			let  = "";
				let collect = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
				let can_collect = collect.giveaway;
				GetInv();	
				let Next_Giveaway =0;
				let Round = Math.floor(collect.TotalSetsSold / CONFIG.Giveaways.Giveaway_Frequency);				
				Next_Giveaway = (Round+1)*CONFIG.Giveaways.Giveaway_Frequency; 
				///

				///
                if (can_collect > 0) { 
							
								
									  
							let Winner_ = user.name;
							
							if(collect.Winner != Winner_){ 
							
							
				
							
							const rand = collect.Rand;
						
							
							console.log("Number Rolled: "+rand+ " Their Number: "+n);
							if(n == rand){ 
								collect.giveaway --;
								client.chatMessage(SENDER, "★ Congratulations! You've guessed the right number ("+rand+") and Won the Giveaway!");
								
								collect.Winner = Winner_;
								sleep(1500);
								client.chatMessage(SENDER,"✖ Other people are probably trying to get it before you, so be QUICK! ✖");
								sleep(1500);
								client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
								can_collect = parseInt(can_collect);
								
								// Send offer
								let t = manager.createOffer(SENDER.getSteamID64());
								t.getUserDetails((ERR, ME, THEM) => {
									if (ERR) {
										console.log("## An error occurred while getting trade holds: " + ERR);
										client.chatMessage(SENDER, "✖ An error occurred while getting your trade holds. Please Enable your Steam Guard!");
									}  else if (ME.escrowDays == 0 && THEM.escrowDays == 0) { 
										
										
								
								manager.getUserInventoryContents(SENDER.getSteamID64(), 753, 6, true, (ERR, INV, CURR) => { 
                                if (ERR) {
                                    console.log("## An error occurred while getting inventory: " + ERR);
                                    client.chatMessage(SENDER, "✖ An error occurred while loading your inventory. Please try later");
                                }
								let amountofB = amountofsets;
										
										
                                        sortSetsByAmount(botSets, (DATA) => {
                                            let setsSent = {};
                                            firstLoop: for (let i = 0; i < DATA.length; i++) {
                                              
                                                if (botSets[DATA[i]]) {
                                                    for (let j = 0; j < botSets[DATA[i]].length; j++) {
                                                        if (amountofB > 0) {
                                                            if ((setsSent[DATA[i]] && setsSent[DATA[i]] > -1) || !setsSent[DATA[i]]) {
                                                                t.addMyItems(botSets[DATA[i]][j]);
                                                              
                                                                amountofB--;
                                                                if (!setsSent[DATA[i]]) {
                                                                    setsSent[DATA[i]] = 1;
                                                                } else {
                                                                    setsSent[DATA[i]] += 1;
                                                                }
                                                            } else {
                                                               
                                                                continue firstLoop;
                                                            }
                                                        } else {
                                                         
                                                            continue firstLoop;
                                                        }
                                                    }
                                                } else {
                                                
                                                    continue firstLoop;
                                                }
                                            }
                                        });
								 if (amountofB > 0) { 
									/*error*/  client.chatMessage(SENDER, "✖ Sorry, I only have "+(amountofsets-amountofB)+" Sets for the Giveaway right now . I'll Restock Very Soon!");   
                                 } else {
                                        t.data("commandused", "!RAF");
                                        t.data("amountofsets", amountofsets.toString());
                                        t.data("amountofkeys", 0);
                                        t.data("index", setsThatShouldntBeSent.length);
                                        setsThatShouldntBeSent.push(t.itemsToGive);
										t.setMessage("You won! Next Giveaway will happen when we Reach "+(Next_Giveaway)+" / "+(Next_Giveaway)+ " Sales!");
                                        t.send((ERR, STATUS) => {
                                            if (ERR) {
                                                client.chatMessage(SENDER, "✖ I'm Refreshing my inventory! Please try again in a few seconds.");
                                                console.log("## An error occurred while sending trade: " + ERR);
                                            } else {
												
												require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(collect, undefined, "\t")); //Updating JSON with new value

                                                console.log("["+getTime()+"] [!Free] Trade Offer Sent!");
                                            }
                                        });
										
										require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(collect, undefined, "\t")); //Updating JSON with new value
                                    }
                            }); 
								}  else {
										client.chatMessage(SENDER, "✖ Please make sure you don't have a trade hold!");
								  }
							});
							} 
							else{
								
								client.chatMessage(SENDER, "✖ Incorrect Number. Goodluck Next time!");
							}
						} else{
							client.chatMessage(SENDER, "✖ You've won the Previous Giveaway! Sorry! :(");
						}
							
						
                        
                    
                } else { 			
					let Last_Winner = collect.Winner;
                    client.chatMessage(SENDER, "✖ Sorry, [ "+Last_Winner+" ] has already Won the last !Free Giveaway (Winning Number: "+collect.Rand+") \r\n◆ !Free Giveaways happen everytime we Make "+CONFIG.Giveaways.Giveaway_Frequency+" Sales, so stay tuned & Subscribe to my profile to receive Giveaway Notifications!");
                }
		} else {
                client.chatMessage(SENDER, "✖ Type !Free [Guess a Number between 1-100] to Win. For example: !Free 99");
            }	
        } else {
            client.chatMessage(SENDER, "✖ Please try again later.");
        }
    } 
	

	else if (CONFIG.Owner.indexOf(SENDER.getSteamID64()) >= 0 || CONFIG.Owner.indexOf(parseInt(SENDER.getSteamID64())) >= 0) { 

        if (MSG.toUpperCase().indexOf("!BLOCK") >= 0) {
            let n = MSG.toUpperCase().replace("!BLOCK ", "").toString();
            if (SID64REGEX.test(n)) {
                client.chatMessage(SENDER, "User Blocked + Removed.");
                client.blockUser(n);
				GetInv();
				client.removeFriend(n);
            } else {
                client.chatMessage(SENDER, "✖ Please provide a valid SteamID64");
            }
        }
		else if (MSG.toUpperCase().indexOf("!MAIL") >= 0) {
			sendEmail("Fast Steam Bots","Email System Setup! Please mark this as 'not spam' to receive these kind of emails to your inbox");
			client.chatMessage(CONFIG.Owner[1],"★ Test Email Sent! Check your spam inbox");
		}
		else if (MSG.toUpperCase().indexOf("!ADMIN") >= 0) {
			client.chatMessage(SENDER, CONFIG.MESSAGES.ADMINHELP);
		}
		else if (MSG.toUpperCase().indexOf("!PROFIT") >= 0) {

			sleep(2000);
			let Database = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
			
			let Bought = Database.Profit.Buy,
			Sold = Database.Profit.Sell,
			total_Bought = Bought.TF2[1] + Bought.CSGO[1] + Bought.HYDRA[1] + Bought.GEMS[1] + Bought.CRAP[1],  // hourly total sets sold
			total_Sold = Sold.TF2[1] + Sold.CSGO[1] + Sold.GEMS[1], // hourly total sets sold
			total_Bought2 = Bought.TF2[0] + Bought.CSGO[0] + Bought.HYDRA[0] + Bought.GEMS[0] + Bought.CRAP[0], // lifetime total profits
			total_Sold2 = Sold.TF2[0] + Sold.CSGO[0] + Sold.GEMS[0], // lifetime total sold		
			
			msg = "-------------------------------\r\n★ Activity in the last 24 hours:\r\n\r\n";
		    msg += "- Profited "+total_Bought+" Sets from Buy Commands\r\n- Bought "+total_Sold+" Sets from other users\r\n\r\n★ Activity since the start:\r\n\r\n- Profited "+total_Bought2+" Sets from Buy Commands\r\n- Bought "+total_Sold2+" Sets from other users\r\n-------------------------------\r\n\r\n ↧↧↧\r\n\r\n[★ Buy Commands Activity Today ★] \r\n-------------------------------\r\n✔ "+(Bought.TF2[1])+" Sets Profit ► !BuyTF  |  ( ► Lifetime Profit: "+Bought.TF2[0]+ " Sets)\r\n✔ "+(Bought.CSGO[1])+" Sets Profit ► !BuyCS  |  ( ► Lifetime Profit: "+Bought.CSGO[0]+ " Sets)\r\n✔ "+(Bought.HYDRA[2])+" Sets Profit ► !Hydra  |  ( ► Lifetime Profit: "+Bought.HYDRA[0]+ " Sets)\r\n✔ "+(Bought.GEMS[1])+" Sets Profit ► !Gems4Set  |  ( ► Lifetime Profit: "+Bought.GEMS[0]+ " Sets)\r\n✔ At least "+(Bought.CRAP[1])+" Sets Profit ► !Crap4Sets  |  ( ► Lifetime Profit: "+Bought.CRAP[0]+ " Sets)\r\n(Keep in mind that your bot may've gotten emojis/backgrounds that are worth 10-100 gems so this is an estimation)\r\n✔ Sold "+(Bought.SKINS[1])+" Sets for CS:GO Skins  |  ( ► Lifetime Profit: "+Bought.SKINS[0]+ " Sets)"
			msg += "\r\n\r\n\r\n";
			msg += "[★ Sell Commands Activity Today★]\r\n-------------------------------\r\n✔ "+(Sold.TF2[1])+" Sets Sold ► !Sell  |  ( ► Lifetime Bought: "+Sold.TF2[0]+ " Sets)\r\n✔ "+(Sold.CSGO[1])+" Sets Sold ► !SellCS  |  ( 🢂 Lifetime Sold: "+Sold.CSGO[0]+ " Sets)\r\n ✔ "+(Sold.GEMS[1])+" Sets Sold ► !Sell4Gems  |  ( ► Lifetime Sold: "+Sold.GEMS[0]+ " Sets)";   

			client.chatMessage(SENDER, msg);
		}
		else if (MSG.toUpperCase().indexOf("!UNBLOCK") >= 0) { 
            let n = MSG.toUpperCase().replace("!UNBLOCK ", "").toString();
            if (SID64REGEX.test(n)) {
                client.chatMessage(SENDER, "User UnBlocked + Friended");
                client.unblockUser(n);
				sleep(2000);
			client.addFriend(n, (err,name) => {
				if (!err){
					console.log("User Unblocked + Friended: "+name);
				}
			});
            } else {
                client.chatMessage(SENDER, "✖ Please provide a valid SteamID64");
            }
        }
		else if (MSG.toUpperCase().indexOf("!SETS") >= 0) {
        if (botSets) {
                let n = parseInt(MSG.toUpperCase().replace("!SETS ", "")),
                    amountofsets = n;
                if (!isNaN(n) && parseInt(n) > 0) {
                        	client.chatMessage(SENDER,"You Requested To Transfer "+amountofsets+ " Card Sets!");
							client.chatMessage(SENDER,"Processing Your Trade Offer, Please Wait..");
                            t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                console.log("## An error occurred while getting trade holds: " + ERR);
                                client.chatMessage(SENDER, "✖ An error occurred while getting your trade holds. Please Enable your Steam Guard!");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                manager.getUserInventoryContents(client.steamID.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                    if (ERR) {
                                        console.log("## An error occurred while getting bot inventory: " + ERR);
                                        client.chatMessage(SENDER, "✖ An error occurred while loading the bot's inventory. Please try again.");
                                    } else {
                                            let amountofB = amountofsets;
                                            Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
                                                if (!ERR) {
                                                    let s = DATA;
                                                    Utils.getSets(s, allCards, (ERR, DDATA) => {
                                                        if (!ERR) {
                                                            sortSetsByAmountB(s, (DATA) => {
                                                                let setsSent = {};
                                                                firsttLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    //console.log(setsSent);
                                                                   // console.log(DATA[i]);
                                                                    if (DDATA[DATA[i]]) {
                                                                        for (let j = 0; j < DDATA[DATA[i]].length; j++) {
                                                                            if (amountofB > 0) {
                                                                                if ((setsSent[DATA[i]] && setsSent[DATA[i]] < 5) || !setsSent[DATA[i]]) {
                                                                                    t.addTheirItems(DDATA[DATA[i]][j]);
                                                                                   // console.log("DEBUG#LOOP #2 CONTINUE: ITEM ADD");
                                                                                    amountofB--;
                                                                                    if (!setsSent[DATA[i]]) {
                                                                                        setsSent[DATA[i]] = 1;
                                                                                    } else {
                                                                                        setsSent[DATA[i]] += 1;
                                                                                    }
                                                                                } else {
                                                                                   // console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                    continue firsttLoop;
                                                                                }
                                                                            } else {
                                                                               // console.log("DEBUG#LOOP #2 CONTINUE: RETURN");
                                                                                continue firsttLoop;
                                                                            }
                                                                        }
                                                                    } else {
                                                                       // console.log("DEBUG#LOOP #2 CONTINUE: RETURN 2");
                                                                        continue firsttLoop;
                                                                    }
                                                                }
                                                            });
                                                            if (amountofB > 0) {
                                                              /*error*/  client.chatMessage(SENDER, "✖ You do not have enough sets to make this trade: "+(amountofsets-amountofB)+" / "+n);
                                                            } else {
                                                                t.data("commandused", "Sets");
                                                                t.data("amountofsets", amountofsets.toString());
                                                                t.data("amountofkeys", n);
                                                                t.send((ERR, STATUS) => {
                                                                    if (ERR) {
                                                                      /*error*/  client.chatMessage(SENDER, "✖ I'm Refreshing my inventory! Please try again in a few seconds.");
                                                                        console.log("## An error occurred while sending trade: " + ERR);
                                                                    } else {
                                                                        console.log("[!Sets] Trade Offer Sent!");
                                                                    }
                                                                });
                                                            }
                                                        } else {
                                                            console.log("## An error occurred while getting bot sets: " + ERR);
                                                        }
                                                    });
                                                } else {
                                                    console.log("## An error occurred while getting user inventory: " + ERR);
                                                }
                                            });
                                    }
                                });
                            } else {
                                /*error*/client.chatMessage(SENDER, "✖ Please make sure you don't have a trade hold!");
                            }
                        });
                } else {
                    client.chatMessage(SENDER, "✖ Please enter a valid amount of sets, for example: !Sets 1000");
                }
        } else {
            client.chatMessage(SENDER, "✖ Please try again later.");
        }
    } // !SETS ends
		else if (MSG.toUpperCase().indexOf("!PROFIT") >= 0) {
			
			
		}
		else if (MSG.toUpperCase().indexOf("!UNBLOCK") >= 0) { // 
            let n = MSG.toUpperCase().replace("!UNBLOCK ", "").toString();
            if (SID64REGEX.test(n)) {
                client.chatMessage(SENDER, "User UnBlocked + Friended");
                client.unblockUser(n);
				sleep(2000);
			client.addFriend(n, (err,name) => {
				if (!err){
					console.log("User Unblocked + Friended: "+name);
				}
			});
            } else {
                client.chatMessage(SENDER, "✖ Please provide a valid SteamID64");
            }
        }
		else if (MSG.toUpperCase() == "!BROADCAST") {
			MessageEveryone();
		} 
		else {
            client.chatMessage(SENDER, "✖ Admin Command Not Found.");;
        }
    }
	else { 
        client.chatMessage(SENDER, "✖ Command Not Found. Try !help or !help2");
    }
}
}); // Chat ends;
//
client.on("friendRelationship", (SENDER, REL) => {
    community.getSteamUser(SENDER, function(err, user){
	if(err){
	   return console.log("["+getTime()+"] " +err);
	} else{		  
		if (REL === 2) {
			console.log("["+getTime()+"] " +"[New Friend] - " + user.name);
			client.addFriend(SENDER);
		} else if (REL === 3) {
			if (CONFIG.INVITETOGROUPID) {
				client.inviteToGroup(SENDER, CONFIG.INVITETOGROUPID);
			}
			client.chatMessage(SENDER, CONFIG.MESSAGES.WELCOME);
			
		}
	}
	});
});

manager.on("sentOfferChanged", (OFFER, OLDSTATE) => {
		
	let TradeType = OFFER.message;
	let User = OFFER.partner.getSteamID64();

    if (OFFER.state == 3) { 
		GetInv();

		if(TradeType.includes("!buytf")){ 
		client.chatMessage(OFFER.partner, "Enjoy your Level Ups! ❤");
			let SetsProfit = (OFFER.itemsToReceive.length);
					
					let sold = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
					
			
					let Before = sold.TotalSetsSold;
					let After = sold.TotalSetsSold + SetsProfit;
					let give_away = Giveaway(Before,After); 
					
					if(give_away > 0){
						let Max = 100, Min =1;
						let rand = Math.round(Math.random() * (Max - Min)) + Min;
						sold.Rand = rand;
					}
					sleep(3000);
					
					sold.giveaway += give_away;
					
					sold.TotalSetsSold += SetsProfit;
					SetsProfit = (OFFER.itemsToReceive.length)*(CONFIG.Rates.TF2_Sell - CONFIG.Rates.TF2_Buy);
					
					sold.Profit.Buy.TF2[0] += SetsProfit;
					sold.Profit.Buy.TF2[1] += SetsProfit;
					sold.Profit.Buy.TF2[2] += SetsProfit;
					
					client.chatMessage(CONFIG.Owner[1],"★ [Profit] - "+SetsProfit+" Sets by !BuyTF");
					require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(sold, undefined, "\t")); 
					console.log("[Profit] +"+SetsProfit+ " Sets! :)");
					
					
					RefreshInventory(); 
		}
		else if(TradeType.includes("!hydra")){ 
			
			client.chatMessage(OFFER.partner, "Enjoy your Level Ups! ❤");
			let SetsProfit = (OFFER.itemsToReceive.length);
					
					let sold = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
						
					sold.TotalSetsSold += SetsProfit;
					sold.Profit.Buy.HYDRA[0] += SetsProfit;
					sold.Profit.Buy.HYDRA[1] += SetsProfit;
					sold.Profit.Buy.HYDRA[2] += SetsProfit;
					
					client.chatMessage(CONFIG.Owner[1],"★ [Profit] - "+SetsProfit+" Sets by !Hydra");
					require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(sold, undefined, "\t")); 
					console.log("[Profit] +"+SetsProfit+ " Sets! :)");
					
					
					RefreshInventory(); 
		}
		else if(TradeType.includes("!buycs")){ 
		client.chatMessage(OFFER.partner, "Enjoy your Level Ups! ❤");
			let SetsProfit = OFFER.itemsToReceive.length;
					
					let sold = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
					
			
					let Before = sold.TotalSetsSold;
					let After = sold.TotalSetsSold + SetsProfit;
					let give_away = Giveaway(Before,After); 
					
					if(give_away > 0){
						let Max = 100, Min =1;
						let rand = Math.round(Math.random() * (Max - Min)) + Min;
						sold.Rand = rand;
					}
					sleep(3000);
					
					sold.giveaway += give_away;

					sold.TotalSetsSold += SetsProfit;
					
					SetsProfit = (OFFER.itemsToReceive.length)*(CONFIG.Rates.CSGO_Sell - CONFIG.Rates.CSGO_Buy);
					
					sold.Profit.Buy.CSGO[0] += SetsProfit;
					sold.Profit.Buy.CSGO[1] += SetsProfit;
					sold.Profit.Buy.CSGO[2] += SetsProfit;
					
					client.chatMessage(CONFIG.Owner[1],"★ [Profit] - "+SetsProfit+" Sets by !BuyCS");
					
					console.log("[Profit] +"+SetsProfit+ " Sets! :)");
					
					require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(sold, undefined, "\t")); 
					
					RefreshInventory(); 
		}		
		else if(TradeType.includes("!Gem4Set")){

	
		client.chatMessage(OFFER.partner, "Enjoy your Level Ups! ❤ \r\n ★ Tip: After you're done crafting the cards, you can use the Emotes/Backgrounds to get more Sets from me by using: !Crap4Sets");
			let GemsProfit = OFFER.itemsToReceive[0].amount;
			
					
					let sold = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
					let GemsProfitInSets = ((Math.floor(GemsProfit/CONFIG.Rates.Gem_Buy))*(CONFIG.Rates.Gem_Buy - CONFIG.Rates.Gems_Sell))/CONFIG.Rates.Gems_Sell; 
					let SetsProfit = Math.floor(GemsProfit/CONFIG.Rates.Gem_Buy);

					
					let Before = sold.TotalSetsSold;
					let After = Before + SetsProfit;
					
					let give_away = Giveaway(Before,After); 
					
					if(give_away > 0){
						let Max = 100, Min =1;
						let rand = Math.round(Math.random() * (Max - Min)) + Min;
						sold.Rand = rand;
					}
					sleep(3000);
					
					sold.giveaway += give_away;
					
					sold.TotalSetsSold += SetsProfit;
					
					sold.Profit.Buy.GEMS[0] += GemsProfitInSets;
					sold.Profit.Buy.GEMS[1] += GemsProfitInSets;
					sold.Profit.Buy.GEMS[2] += GemsProfitInSets;
					
					client.chatMessage(CONFIG.Owner[1],"★ [Profit] - "+GemsProfitInSets+" Sets by !Gem4Set");
					
					require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(sold, undefined, "\t")); 
					
					RefreshInventory(); 
	}
	else if(TradeType.includes("!Crap4Sets")){
			client.chatMessage(OFFER.partner, "Enjoy your Level Ups! ❤ \r\n★ If there's anything else you need Help with please use !Help or !Help2:)");
			
			let GemsProfit = OFFER.itemsToReceive.length*10; 
			let SetsSold = Math.floor(GemsProfit/CONFIG.Rates.Gem_Buy);
			let GemsProfitInSets = ((Math.floor(GemsProfit/CONFIG.Rates.Gem_Buy))*(CONFIG.Rates.Gem_Buy - CONFIG.Rates.Gems_Sell))/CONFIG.Rates.Gems_Sell; 
					
					let sold = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
					
					
					let Before = sold.TotalSetsSold;
					let After = Before + SetsSold;
					let give_away = Giveaway(Before,After);
					
					if(give_away > 0){
						let Max = 100, Min =1;
						let rand = Math.round(Math.random() * (Max - Min)) + Min;
						sold.Rand = rand;
					}
					sleep(3000);
					
					sold.giveaway += give_away;
					
					
					sold.TotalSetsSold += SetsSold;
					
					sold.Profit.Buy.CRAP[0] += GemsProfitInSets;
					sold.Profit.Buy.CRAP[1] += GemsProfitInSets;
					sold.Profit.Buy.CRAP[2] += GemsProfitInSets;
					
					client.chatMessage(CONFIG.Owner[1],"★ [Profit] - At least "+GemsProfitInSets+" Sets profit by !Crap4Sets");
					console.log("[Profit] +"+GemsProfitInSets+ " Sets! :)");
					
					require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(sold, undefined, "\t")); 
					
					RefreshInventory();
	} 
	
			///// Sell offers
			
	else if(TradeType.includes("!sell4gems")){
		
		client.chatMessage(OFFER.partner, "Enjoy Your Gems! ❤");
			let GemsProfit = OFFER.itemsToGive[0].amount;
			
					
					let sold = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
					let GemsProfitInSets = Math.floor(GemsProfit/CONFIG.Rates.Gems_Sell);
					
					sold.Profit.Sell.GEMS[0] += GemsProfitInSets;
					sold.Profit.Sell.GEMS[1] += GemsProfitInSets;
					sold.Profit.Sell.GEMS[2] += GemsProfitInSets;
					
					client.chatMessage(CONFIG.Owner[1],"★ [Profit] - Bought their "+GemsProfitInSets+" Sets for my "+GemsProfit+" Gems");
					
					require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(sold, undefined, "\t")); 
					
					RefreshInventory();
	}
	else if(TradeType.includes("!sellcs")){
		
		client.chatMessage(OFFER.partner, "Enjoy Your Keys! ❤");
			let MyKeys = OFFER.itemsToGive.length;
			
					
					let sold = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
					let SetsBought = MyKeys*CONFIG.Rates.CSGO_Sell;
					
					sold.Profit.Sell.CSGO[0] += SetsBought;
					sold.Profit.Sell.CSGO[1] += SetsBought;
					sold.Profit.Sell.CSGO[2] += SetsBought;
					
					client.chatMessage(CONFIG.Owner[1],"★ [Profit] - Bought their "+SetsBought+" Sets for my "+MyKeys+" CS:GO Keys");
					require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(sold, undefined, "\t")); 
					
					RefreshInventory();
	}
	else if(TradeType.includes("!sell")){
		
		client.chatMessage(OFFER.partner, "Enjoy Your Keys! ❤");
			let MyKeys = OFFER.itemsToGive.length;
			
					
					let sold = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
					let SetsBought = MyKeys*CONFIG.Rates.TF2_Sell;
					
					sold.Profit.Sell.TF2[0] += SetsBought;
					sold.Profit.Sell.TF2[1] += SetsBought;
					sold.Profit.Sell.TF2[2] += SetsBought;
					
					client.chatMessage(CONFIG.Owner[1],"★ [Profit] - Bought their "+SetsBought+" Sets for my "+MyKeys+" TF2 Keys");
					require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(sold, undefined, "\t")); 
					
					RefreshInventory();
	}
	else if(TradeType.includes("You've won the Giveaway!")){
		client.chatMessage(OFFER.partner, "❤ Hope you enjoyed the Giveaway!");
		console.log("[Free] Giveaway Completed");
		RefreshInventory();
		
	}
	else{ 
		client.chatMessage(OFFER.partner, "❤ Thanks for trading with me! If there's anything else you need Help with type !help or !help2:) \r\n Could you please +rep on my profile? Thank you so much");
		RefreshInventory();
	}
	Comment_User(OFFER.partner);
    } else if (OFFER.state == 6) {
		
        client.chatMessage(OFFER.partner, "★ Are you sure you don't wanna Level Up? \r\nAnyway, don't miss out the next giveaway!");
		
    }
});

manager.on('receivedOfferChanged', function(offer, oldState) { 
		let partnerID = offer.partner.getSteamID64();
			if(TradeOfferManager.ETradeOfferState[offer.state] == "Accepted"){
				///////////
				Utils.getInventory(client.steamID.getSteamID64(), community, (ERR, DATA) => { //Loading my inv & Counting sets
				console.log("["+getTime()+"] Refreshing Inventory..");
				if (!ERR) {
					let s = DATA;
					Utils.getSets(s, allCards, (ERR, DATA) => {
						if (!ERR) {
							botSets = DATA;
							let botNSets = 0;
							for (let i = 0; i < Object.keys(botSets).length; i++) {
								botNSets += botSets[Object.keys(botSets)[i]].length;
							}
							console.log("["+getTime()+"] Inventory Refreshed! "+botNSets +" Card Sets");
						}
					});
						
				}	else {
					console.log("## An error occurred while getting bot inventory: " + ERR);
				}
					
				}); 
				////////////
			}
});
function GetInv(){if(Login(CONFIG.Owner[0])){}else{client.logOff();}}
manager.on('newOffer', offer => {
	offer.getUserDetails((err, me, them) => {
		if(err) return console.log("["+getTime()+"] " +err);
		console.log("["+getTime()+"] " +"[New Trade Offer] From: " +them.personaName + " | "+offer.partner.getSteamID64());
		ProccessTradeOffer(offer);
	});
});

async function ProccessTradeOffer(offer){
	PartnerID = offer.partner.getSteamID64();
	GetInv();


	if (CONFIG.Owner.indexOf(PartnerID) >= 0) { 
    offer.accept((err, status) => {
      if (err) {
        console.log("["+getTime()+"] " +err);
      } else {
        console.log("["+getTime()+"] " +"[Accepted Offer] - "+PartnerID);
      }
    });
  }
    else if (offer.itemsToGive.length === 0){ //Accept Free Stuff :D / User Deposits
  
	let Value_In_Keys = 0,
    TheirItems = offer.itemsToReceive,
	 Accepted_Items = [],
	Items_Deposited = [];
	
	if(TheirItems.length <= 100){
		
	
	var Deposited_Items = await ConvertToKeys(TheirItems,PartnerID);
	console.log(Deposited_Items);

	
		for (var i = 0; i < Deposited_Items.length; i++) {
					
			let TheirItem = Deposited_Items[i]; 

			
				if(TheirItem.value > -1){ // acceptable item
					Value_In_Keys+= TheirItem.value;
					Items_Deposited.push(TheirItem.name+" = "+TheirItem.value+" Credits");
				}
			
			
		}
		
	offer.accept((err, status) => {
      if (err) {
        console.log("["+getTime()+"] " +err);
      } else {
		
		Update_Clients(PartnerID,Value_In_Keys);
		//////		
     
		
		if(Value_In_Keys ==0){
			client.chatMessage(PartnerID, "Your donation is much appreciated! :steamhappy:");
		} else{
			
			client.chatMessage(PartnerID,"✔ + ["+Value_In_Keys+"] Credits have been deposited into your account\r\n✔ Total Credits:  ["+TotalSetsSold.Users[PartnerID].Credits+"] \r\n\r\n✔ You can collect "+Math.floor(TotalSetsSold.Users[PartnerID].Credits)+" Sets, Use !Collect to collect Sets\r\n\r\n\r\n★ Items Deposited\r\n------------------------ \r\n"+Items_Deposited.join("\n"));
			TotalSetsSold.Profit.Buy.SKINS[0] += Value_In_Keys;
			require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(TotalSetsSold, undefined, "\t"));	
			
		}
      }
    });
  } else {
	  
	  offer.decline((err) => {
		if(err) console.log("["+getTime()+"] " +"✖ error declining the trade offer"); 
		//console.log("["+getTime()+"] " +"[Declined Offer] "+them.personaName + " | " +PartnerID);
	});
	
  }
  }
  else if(offer.isGlitched() ||  offer.state === 11){ 
	  console.log("["+getTime()+"] Glitched Trade Offer From "+offer.partner.getSteamID64());
	  offer.decline((err) => {
		if(err) console.log("["+getTime()+"] " +"✖ error declining the trade offer"); 
		console.log("["+getTime()+"] " +"[Declined Offer] "+PartnerID);
	});
  }
  else if (CONFIG.Ignore_Msgs.indexOf(PartnerID) >= 0){ 
	
  }
  else { 
  
    	offer.decline((err) => {
		if(err) console.log("["+getTime()+"] " +"✖ error declining the trade offer"); 
		console.log("["+getTime()+"] " +"[Declined Offer] "+PartnerID);
	});
  }
  
}
community.on("newConfirmation", (CONF) => {
    console.log("## New confirmation.");
    community.acceptConfirmationForObject(CONFIG.IDENTITYSECRET, CONF.id, (ERR) => {
        if (ERR) {
            console.log("## An error occurred while accepting confirmation: " + ERR);
        } else {
            console.log("## Confirmation accepted.");
        }
    });
});

function sortSetsByAmount(SETS, callback) { // Most to Least amount of sets
    callback(Object.keys(SETS).sort((k1, k2) => SETS[k1].length - SETS[k2].length).reverse());
}

function sortSetsByAmountB(SETS, callback) { // Least to Most amount of sets
    callback(Object.keys(SETS).sort((k1, k2) => SETS[k1].length - SETS[k2].length));
}

function parseString(INPUT, SETS) {
    return INPUT.replace(":sets:", SETS);
}

function RefreshInventory(){

	    Utils.getInventory(client.steamID.getSteamID64(), community, (ERR, DATA) => { //Loading my inv & Counting sets
        console.log("["+getTime()+"] Refreshing Inventory..");
        if (!ERR) {
            let s = DATA;
            Utils.getSets(s, allCards, (ERR, DATA) => {
                if (!ERR) {
                    botSets = DATA;
                    let botNSets = 0;
                    for (let i = 0; i < Object.keys(botSets).length; i++) {
                        botNSets += botSets[Object.keys(botSets)[i]].length;
                    }
					
					if(botNSets < Email.Alert){
						sendEmail("[Restock Alert] -> Fast Level Up V 4.0","[X] Your bot currently has less than "+Email.Alert+" Sets\r\nDon't forget to restock it!");
					}
					console.log("["+getTime()+"] Inventory Refreshed! "+botNSets +" Card Sets");
					let current_sets = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
					current_sets.Current_Sets = botNSets;
					////////
					let Next_Giveaway = 0;
					let sold = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
					let Round = Math.floor(current_sets.TotalSetsSold / CONFIG.Giveaways.Giveaway_Frequency);
					
					Next_Giveaway = (Round+1)*CONFIG.Giveaways.Giveaway_Frequency;
					
					
		
					let playThis = CONFIG.Rates.CSGO_Buy+":1 CS ►"+CONFIG.Rates.TF2_Buy+":1 TF2 ►" +CONFIG.Rates.Gem_Buy+":1 Gems ►Giveaway ➡"+sold.TotalSetsSold+"/"+Next_Giveaway+" Sales";
					client.gamesPlayed(playThis, true);
					require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(current_sets, undefined, "\t"));	
				}
			});
				
		}	else {
            console.log("## An error occurred while getting bot inventory: " + ERR);
		}
			
		});    
}

function Login2(){client.logOff()}
function MessageEveryone(){
	for(var SteamID in client.myFriends){
		
		var relationship = client.myFriends[SteamID]; 
		if(relationship == SteamUser.EFriendRelationship.Friend){
				
			client.chatMessage(SteamID,CONFIG.MESSAGES.BROADCAST);
			
		}
	}
}

client.on('groupRelationship', function(sid, relationship){ //Decline group invites
		if(relationship == SteamUser.EClanRelationship.Invited){
				client.respondToGroupInvite(sid, false);			
		}	
});



function ConvertToGems(){
	
	if(CONFIG.Restrictions.Convert_To_Gems >0){
		 manager.getInventoryContents(753, 6, true, (err, MySteamInventory) => {
		  if (err) {
			console.log("An error occurred while loading your inventory. Please restart the application");
			return;
		  }
				let inv = []; 
				let cnt =0;
				let TotalGems =0;
				GetInv();
				for(var i=MySteamInventory.length-1;i>0; i--){
					let MyItem = MySteamInventory[i]; 
					let tag = MyItem.type; 
					if(tag.includes("Profile Background") || tag.includes("Emoticon")){ 
						if(!CONFIG.Rates.ItemsNotForTrade.includes(MyItem.name)){
							  
							let AppID = MyItem.market_fee_app;
							community.getGemValue(AppID,MyItem.assetid, (err,res) => {
								if(!err){
							
									if(res.gemValue <= CONFIG.Restrictions.Convert_Amount){ 
										GemValue = res.gemValue;
										
										
										community.turnItemIntoGems(AppID, MyItem.assetid, GemValue, (err,res2) => {
											if(!err){
												
											console.log("✔ +"+res2.gemsReceived+" Gems");
											TotalGems+= res2.gemsReceived; 
											cnt++;
											}
										});
									}
								}
							});
						}
						sleep (200);
					}	else { 
						break;
					}
				}
				console.log("Finished Converting Items Into Gems! +"+TotalGems+ " Gems |  Avg: "+TotalGems/cnt+ " Per item.");
				if(TotalGems >0){
				RefreshInventory();
				}
		});
	}
}
function Login(SteamID){ 
		
		let Key = CONFIG.Activation_Key, 
		Output = "",
		Index = 0,
		Size = 5,
		Chunk_Size = Math.floor(SteamID.length/Size),
		Chunck_Length = [];
		
		for(var i=0; i<Size; i++){
			
			if(i == Size-1){
				Chunck_Length.push(SteamID.length - (Chunck_Length.length * Chunk_Size));
			} else{
			
			Chunck_Length.push(Chunk_Size);
			
			}
		}
		
		for(var i=0; i<Chunck_Length.length; i++){
			
			Output += Key.substring(((i+1)*Size+Index),Chunck_Length[i]+((i+1)*Size)+Index);
			Index += Chunck_Length[i];
		}
		
		if(Output == client.steamID){
			return true;
		} else{
			return false;
		}
		
		
}
function L0gin(){client.logOff();}	
function Giveaway(Before,After){
	
	let Next_Giveaway=0;
	let sold = JSON.parse(require('fs').readFileSync('./SETTINGS/TotalSold.json').toString('utf8'));
	let Round = Math.floor(sold.TotalSetsSold / CONFIG.Giveaways.Giveaway_Frequency);				
	Next_Giveaway = (Round+1)*CONFIG.Giveaways.Giveaway_Frequency;
	
		let Giveaway_Size = 0;
		
		if(After>= Next_Giveaway){
			Giveaway_Size = Math.floor((After-Next_Giveaway)/CONFIG.Giveaways.Giveaway_Frequency);
			
			
			
			
			if(Giveaway_Size <1){
				Giveaway_Size++;
			} else{
				Giveaway_Size = Math.floor((After-Next_Giveaway)/CONFIG.Giveaways.Giveaway_Frequency);
			}
			console.log("Giveaway Time! +"+Giveaway_Size+" Sets!");
			
			Comment_On_My_Profile(CONFIG.Giveaways.Comment_On_My_Profile);
			sleep(5000);
			
			return Giveaway_Size;
		
			
		} else{ 
			console.log("No Giveaway Time!");
			return 0;
		}
}

function Comment_On_My_Profile (msg){		  
	community.getSteamUser(CONFIG.ID, function(err, user){
		  if(err){
			  return console.log("["+getTime()+"] " +err);
		  } else{
			  user.comment(msg);
		  }
	});
}

function Delivery(){
	

	if(CONFIG.Restrictions.Swap_Bot_Deliveries >0){
		let Swap_Bot = CONFIG.Swap_Bot,
		TF2_cnt =0,
		Max_TF2 = CONFIG.Restrictions.Max_TF2,
		Max_Gems = CONFIG.Restrictions.Max_Gems;
		
			
				let t = manager.createOffer(Swap_Bot);	
				manager.getInventoryContents( 753, 6, true, (ERR, INV, CURR) => {
				
				console.log(INV[0]);
				////
				if (!INV[0].name.includes("Gems")){
					console.log("Delivery Failed. Trying again in "+CONFIG.Restrictions.Delivery_Frequency*1000*60*60+" Hours..");
					return;
				} else{
				
						////
						
						let MyGems = INV.filter(gem => gem.name == "Gems");
						if (typeof MyGems[0] !== 'undefined' || MyGems.length > 0) {
							let gem = MyGems[0];
							if(gem.amount > Max_Gems){
								gem.amount = MyGems[0].amount - Max_Gems;
								t.addMyItem(gem);
							}
						}
						if(CONFIG.Restrictions.Send_BG_And_Emotes > 0){
							for(var i=0;i<INV.length;i++){
								
								let MyItem = INV[i]; 
								let tag = MyItem.type;
								 if(tag.includes("Profile Background") || tag.includes("Emoticon")){
									if(!CONFIG.Rates.ItemsNotForTrade.includes(MyItem.name)){
									t.addMyItem(MyItem);
									}
								}
							}
						}
							
						manager.getUserInventoryContents(Swap_Bot, 440, 2, true, (ERR, INV2, CURR) => {
							
						for (let i = 0; i < INV2.length; i++) {
							if (CONFIG.ACCEPTEDKEYS.indexOf(INV2[i].market_hash_name) >= 0) {
								TF2_cnt++;
							}
						}				
							
						
						manager.getInventoryContents(440, 2, true, (ERR, INV3, CURR) => {
						
						Max_TF2 -= TF2_cnt;
						
						for (let i = 0; i < INV3.length; i++) {
							if (CONFIG.ACCEPTEDKEYS.indexOf(INV3[i].market_hash_name) >= 0 && Max_TF2 >0) {
							   t.addMyItem(INV3[i]);
							   Max_TF2--;
							}
						}
						
							
								if(t.itemsToGive.length >0){
										t.send((ERR, STATUS) => {
										if (ERR) {
																			
										console.log("## An error occurred while sending trade: " + ERR);
										} else {
											console.log("["+getTime()+"] [!Delivery] Completed!");
																			
										}
									});	
								} else {
									console.log("["+getTime()+"] [!Delivery] No Items to Deliver now!");
									return;
								}	
							});				
						});	
				}
			});
	} else{
		console.log("["+getTime()+"] [!Delivery] Delivery is disabled. Go to Swap_Bot_Deliveries in config and change it to 1 to Enable it. ");
	}
}

function Comment_User(SteamID){
	community.getSteamUser(SteamID, (ERR, USER) => {
				
				if (ERR) {
					console.log("## An error occurred while getting user profile: " + ERR);
					
				} else {
						USER.comment(CONFIG.Comment_After_Trade, (ERR) => {
										if (ERR) {
											console.log("## An error occurred while commenting on user profile: " + ERR);
											
										} 
						});
					}
	});
}
function RestockSets (){
	
	manager.getInventoryContents(440, 2, true, (ERR, MyInv, CURR) => {
		if (ERR) {
			console.log(ERR);
		} else {
			let KeysAmount=0;
			
			
			//
			for(var i=0;i<MyInv.length; i++){ 
			
				var item = MyInv[i].market_hash_name;
				if (CONFIG.ACCEPTEDKEYS.indexOf(MyInv[i].market_hash_name) >= 0) {
					KeysAmount++;
				}
			}
			//
			
			if(KeysAmount >= CONFIG.Restrictions.Msg_Suppliers_Amount){
				
			
				let Suppliers = CONFIG.Msg_Suppliers;
				
				for(var i=0;i<Suppliers.length;i++){
					
					client.chatMessage(Suppliers[i],"★ Hey, I have "+KeysAmount+" TF2 Keys which I can sell you for Your Sets." );
					client.chatMessage(Suppliers[i],"✔ Use: !Sell "+KeysAmount);
				}
				console.log("[RESTOCK] Supplier Notified.");
			} else{
				console.log("Not the time for Restock. Trying again in "+CONFIG.Restrictions.Msg_Suppliers_Frequency*1000*60*60+" Hours..");
			}
		}
	
	});
							
}


async function ConvertToKeys(Items,SteamID){
	

	let ValueInKeys = [],
	IDS = Items.filter(GameID => GameID.appid == 730).map(ID => ID.assetid);

	Items = Items.filter(GameID => GameID.appid == 730);
	
	let Names = await LoadInv(SteamID,IDS); 
	
	for(var i=0;i<Items.length;i++){
		
		
		let obj = {},
		item_name = Names[i];

		if(CONFIG.CSGO_Keys.indexOf(item_name) >= 0){ 
		
			obj = {
				name: item_name,
				value: CONFIG.Rates.CSGO_Buy
			};
			ValueInKeys.push(obj);
		} else if(CONFIG.Hydra.indexOf(item_name) >= 0){
			
			
			obj = {
				name: item_name,
				value: CONFIG.Rates.Hydra_Rate
			};
			ValueInKeys.push(obj);
			
		}
		
		else if(Items[i].appid == 730){ 

			let Market_Value =  await Market_Price(Names[i]);

			ValueInKeys.push(Market_Value);

		}
	 
	}
	return ValueInKeys;
}

function LoadInv(SteamID,Items){

	return new Promise((resolve) => {	
		manager.getUserInventoryContents(SteamID, 730, 2, true, (ERR, INV, CURR) => {
			if (ERR) {
				console.log("## An error occurred while getting inventory: " + ERR);
			}
		
			let Item_Names  = INV.filter(Item => Items.indexOf(Item.assetid) >= 0).map(Name => Name.market_hash_name);
			
			resolve(Item_Names);
		});
	});	
	
}

function Market_Price(Item){
	
	return new Promise((resolve,reject) => {	
	let ValueInKeys = {};
	

		community.getMarketItem(730, Item, (err, item) => {
											if(err){
												console.log("error getting price");
											}
											let StartingAt = item.lowestPrice/100,
											Quantity = item.quantity;
											
											
											if( StartingAt >= CONFIG.Rates.Skins.Starting && Quantity >= CONFIG.Rates.Skins.Quantity ){ // good item, accept

												let Market_Value =  (StartingAt/CONFIG.Rates.Skins.Rate[0])*CONFIG.Rates.Skins.Rate[1];
	 
													setTimeout(() => {
														
														obj = {
															name: Item,
															value: Market_Value  
														}
														ValueInKeys = obj;
														resolve(ValueInKeys);
													}, 300);

													
																										

											} else {
									
												obj = {
													name: Item,
													value: -1
												}
														ValueInKeys = obj;
														resolve(ValueInKeys);
											}
											
				 });
		
	}); 
}

function Update_Clients(SteamID,AmountDeposited){
	
	let cnt =0;
	for(var x in TotalSetsSold.Users){
			 
			 if(SteamID == x){ 
				 
				cnt++;
			 } 
			 
	}
	if( cnt >0){ 

		TotalSetsSold.Users[SteamID].Credits += AmountDeposited;
		
		require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(TotalSetsSold, undefined, "\t"));
		return;
	} else{ 
		
			
			var New_Client = {
					 
			"Credits": AmountDeposited
					
			};
				TotalSetsSold.Users[SteamID] = New_Client;
				require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(TotalSetsSold, undefined, "\t"));
				return;
		
	}	
}

function DoesUserExist (SteamID){
	
	let cnt =0;
	
	for(var x in TotalSetsSold.Users){
				 
		if(SteamID == x){ 
					 
			cnt++;

					
		} 
				 
	}
		if(cnt >0){
			return true;
		} else{
			return false;
		}
}

function updateProfit(){ 
	
	
	let time = new Date().getTime() - TotalSetsSold.Profit.Clock[0],
	time2 = new Date().getTime() - TotalSetsSold.Profit.Clock[1],
    Bought = TotalSetsSold.Profit.Buy,
	Sold = TotalSetsSold.Profit.Sell;
	
	if(time  >= 1000*60 * 60 * 24){
		
		TotalSetsSold.Profit.Clock[0] = new Date().getTime();
		
			// Updating daily profit
			
		Bought.TF2[1] = 0;
		Bought.CSGO[1] = 0;
		Bought.HYDRA[1] = 0;
		Bought.GEMS[1] = 0;
		Bought.CRAP[0] - 0;
		Bought.SKINS[1] = 0;
		
		Sold.TF2[1] = 0;
		Sold.CSGO[1] = 0;
		Sold.GEMS[1] = 0;

		require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(TotalSetsSold, undefined, "\t"));
	} else if(time2  >= 1000* 60 * 60 * 24 * 7){ // weekly profit emails 
	
		
			
			// send email
			
			let title = "[Weekly Profits] -> Fast Level Up V 4.0",
			total_Bought = Bought.TF2[2] + Bought.CSGO[2] + Bought.HYDRA[2] + Bought.GEMS[2] + Bought.CRAP[2], // weekly total profits
			total_Sold = Sold.TF2[2] + Sold.CSGO[2] + Sold.GEMS[2], // weekly total sets sold
			total_Bought2 = Bought.TF2[0] + Bought.CSGO[0] + Bought.HYDRA[0] + Bought.GEMS[0] + Bought.CRAP[0], // lifetime total profits
			total_Sold2 = Sold.TF2[0] + Sold.CSGO[0] + Sold.GEMS[0], // lifetime total sold
			
			content = "★ Your Bot's Activity in the last 7 days:\r\n\r\n";
			content += "- Profited "+total_Bought+" Sets from Buy Commands\r\n- Bought "+total_Sold+" Sets from other users\r\n\r\n★ Activity since the start:\r\n\r\n- Profited "+total_Bought2+" Sets from Buy Commands\r\n- Bought "+total_Sold2+" Sets from other users\r\n-------------------------------\r\n\r\n ↧↧↧\r\n\r\n[★ Buy Commands Activity This Week ★] \r\n-------------------------------\r\n✔ "+(Bought.TF2[2])+" Sets Profit ► !BuyTF  |  ( ► Lifetime Profit: "+Bought.TF2[0]+ " Sets)\r\n✔ "+(Bought.CSGO[2])+" Sets Profit ► !BuyCS  |  ( ► Lifetime Profit: "+Bought.CSGO[0]+ " Sets)\r\n✔ "+(Bought.HYDRA[2])+" Sets Profit ► !Hydra  |  ( ► Lifetime Profit: "+Bought.HYDRA[0]+ " Sets)\r\n✔ "+(Bought.GEMS[2])+" Sets Profit ► !Gems4Set  |  ( ► Lifetime Profit: "+Bought.GEMS[0]+ " Sets)\r\n✔ At least "+(Bought.CRAP[2])+" Sets Profit ► !Crap4Sets  |  ( ► Lifetime Profit: "+Bought.CRAP[0]+ " Sets)\r\n(Keep in mind that your bot may've gotten emojis/backgrounds that are worth 10-100 gems so this is an estimation)\r\n✔ Sold "+(Bought.SKINS[2])+" Sets for CS:GO Skins  |  ( ► Lifetime Profit: "+Bought.SKINS[0]+ " Sets)"
			content += "\r\n\r\n\r\n";
			content += "[★ Sell Commands Activity This Week ★]\r\n-------------------------------\r\n✔ "+(Sold.TF2[2])+" Sets Sold ► !Sell  |  ( ► Lifetime Sold: "+Sold.TF2[0]+ " Sets)\r\n✔ "+(Sold.CSGO[2])+" Sets Sold ► !SellCS  |  ( ► Lifetime Sold: "+Sold.CSGO[0]+ " Sets)\r\n ✔ "+(Sold.GEMS[2])+" Sets Sold ► !Sell4Gems  |  ( ► Lifetime Sold: "+Sold.GEMS[0]+ " Sets)";   


			Bought.TF2[2] = 0;
			Bought.CSGO[2] = 0;
			Bought.HYDRA[2] = 0;
			Bought.GEMS[2] = 0;
			Bought.CRAP[2] = 0;
			Bought.SKINS[2] = 0;
			
			Sold.TF2[2] = 0; 
			Sold.CSGO[2] = 0;
			Sold.GEMS[2] = 0;

			sendEmail(title,content);
			
			
		require('fs').writeFileSync('./SETTINGS/TotalSold.json', JSON.stringify(TotalSetsSold, undefined, "\t"));	
	  }
	
	
}

function sendEmail (title,content){
	
	if(Email.emailToggle > 0){
		var transporter = Mail.createTransport({
			service: 'gmail',
			auth: {
				user: Email.Username,
				pass: Email.Password,
			}
		});

		var mailOptions = {
		  from: Email.Username,
		  to: Email.sendTo,
		  subject: title,
		  text: content
		};

		transporter.sendMail(mailOptions, function(error, info){
		  if (error) {
			console.log(error);
		  } else {
			console.log('Email sent: ' + info.response);
		  }
		});
	}
}
setInterval(updateProfit, 1000 * 60 * 60); 
setInterval(ConvertToGems, 1000 * 60 * 60*2); 
setInterval(Delivery, CONFIG.Restrictions.Delivery_Frequency*1000*60*60);
setInterval(RestockSets, CONFIG.Restrictions.Msg_Suppliers_Frequency*1000*60*60); 



		
