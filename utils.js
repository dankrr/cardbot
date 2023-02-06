var Games = require("./SETTINGS/Games2.json");

let _ = require('lodash'),
    request = require('request'),
    config = require("./SETTINGS/config.js"),
    t = {};

t.getInventory = (SID, B, callback) => {
    B.getUserInventoryContents(SID, 753, 6, true, (ERR, INV, CURR) => {
        if (ERR) {
            callback(ERR);
        } else {
            INV = INV.filter((ITEM) => ITEM.getTag("item_class").internal_name == "item_class_2");
            INV = INV.filter((ITEM) => ITEM.getTag("cardborder").internal_name == "cardborder_0");

            var sInventory = INV;
            sInventory = _.groupBy(sInventory, (CEconItem) => CEconItem['market_hash_name'].split('-')[0]);

            _.forOwn(sInventory, function(CEconItemArray, appid) {
                sInventory[appid] = _.groupBy(CEconItemArray, 'classid');
            });
            callback(null, sInventory);
        }
    });
};

t.getContents = (CONTENTS, callback) => { // Counts how many sets are sent in a trade offer
	 CONTENTS = CONTENTS.filter((ITEM) => ITEM.getTag("item_class").internal_name == "item_class_2"); 
	 CONTENTS = CONTENTS.filter((ITEM) => ITEM.getTag("cardborder").internal_name == "cardborder_0");
	 
	 var sInventory = CONTENTS;
     sInventory = _.groupBy(sInventory, (CEconItem) => CEconItem['market_hash_name'].split('-')[0]);
	 
     _.forOwn(sInventory, function(CEconItemArray, appid) {
     sInventory[appid] = _.groupBy(CEconItemArray, 'classid');	 
	 });
	 callback(null, sInventory);
	
};

t.maxSets = function(cardsFromSortedInventory) {
    let cardCounts = _.mapValues(cardsFromSortedInventory, (cardsArray) => cardsArray.length);
    cardCounts = Object.keys(cardCounts).map((key) => cardCounts[key]);
    return Math.min(...cardCounts);
}

t.getCardsInSets = (callback) => {
    request("http://cdn.steam.tools/data/set_data.json", { json: true }, (ERR, RES, BODY) => {
        if (!ERR && RES.statusCode == 200 && BODY) {
            let c = BODY,
                d = {};
            for (let i = 0; i < c.sets.length; i++) {
                d[c.sets[i].appid] = { appid: c.sets[i].appid, name: c.sets[i].game, count: c.sets[i].true_count };
            }
            callback(null, d);
        } else {
            callback(ERR);
        }
    });
};
/*
t.getGamesData = function() {
	var json = $require("./SETTINGS/Games.json");
	return json; //returns the entire JSON file which contains all of the cards data
};*/

t.getSets = (INV, DATA, callback) => {
	//var dataSource = t.getGamesData();
	//dataSource.forEach(function(dataItem){
	Games.forEach(function(dataItem){
		DATA[dataItem.AppId] = {
			appid: dataItem.AppId,
			name: dataItem.Game,
			count: dataItem.count
		};
	});
    let s = {};

    _.forOwn(INV, (c, id) => {

		/*
        DATA["448130"] = {
            appid: "448130",
            name: "Sharf",
            count: 5
        };*/
			
		//DATA["1930"] = {appid: "1930",name: "Two Worlds: Epic Edition",count:15 };
		////////NEW CARDS ADDED HERE////////
        let uc = Object.keys(c).length;
        if (DATA[id.toString()] && uc == DATA[id.toString()].count) {
            r = t.maxSets(c);
            s[id.toString()] = [];
            for (let i = 0; i < r; i++) {
                let set = [];
                _.forOwn(c, (e) => {
                    set.push(e[i]);
                });
                s[id.toString()].push(set);
            }
        } else if (!DATA[id.toString()]) {
            console.log("## Card set non-existant, skipping it, ID: "+DATA[id]);
        }
    });
    callback(null, s);
};

t.getBadges = (SID, callback) => {
    request("http://api.steampowered.com/IPlayerService/GetBadges/v1/?key=" + config.STEAMAPIKEY + "&steamid=" + SID, { json: true }, (ERR, RES, BODY) => {
        if (!ERR && RES.statusCode == 200 && BODY.response) {
            let badges = BODY.response,
                b = {};
            //console.log(badges);
            if (badges.badges) {
                badges.badges.forEach(function(badge) {
                    if ('appid' in badge && (!badge.badge_border_color || badge.border_color !== 1)) {
                        b[badge.appid] = badge.level;
                    }
                });
                callback(null, b, badges.player_level, (badges.player_xp - badges.player_xp_needed_current_level));
            } else {
                callback(null, "nobadges")
            }
        } else {
            callback(ERR);
        }
    });
};

module.exports = t;
