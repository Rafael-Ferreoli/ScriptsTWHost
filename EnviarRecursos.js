javascript:

//if (getMalboaConfig && !getMalboaConfig() && getMalboaConfig().enviarRecursoMainConfig.coordenada) {
//	coordinate = getMalboaConfig().enviarRecursoMainConfig.coordenada
//} else {
//	coordinate = '612|463';
//}
if (!coordinate) {
	coordinate = '605|490';
}

var warehouseCapacity = [];
var allWoodTotals = [];
var allClayTotals = [];
var allIronTotals = [];
var availableMerchants = [];
var totalMerchants = [];
var farmSpaceUsed = [];
var farmSpaceTotal = [];
var villagesData = [];
var allWoodObjects, allClayObjects, allIronObjects, allVillages;
var totalsAndAverages = "";
var data, totalWood = 0, totalStone = 0, totalIron = 0, resLimit = manterAldiea ? manterAldiea : 15;
var sendBack;
var totalWoodSent = 0; totalStoneSent = 0; totalIronSent = 0;
var tempo = 0;
var timeExecucao = 75;
if (!grupoExecucao) {
	grupoExecucao = '70209';
}


var allWoodObjects, allClayObjects, allIronObjects, allVillages;

if (typeof woodPercentage == 'undefined') {
    woodPercentage = 28000 / 83000;
    stonePercentage = 30000 / 83000;
    ironPercentage = 25000 / 83000;
}

if (game_data.player.sitter > 0) {
    URLReq = `game.php?t=${game_data.player.id}&screen=overview_villages&mode=prod&group=${grupoExecucao}`;
}
else {
    URLReq = `game.php?&screen=overview_villages&mode=prod&group=${grupoExecucao}`;
}
//while (true) {
	$.get(URLReq, function () {
		console.log("Managed to grab the page");
	})
		.done(function (page) {
		console.log("Starting - Enviar Recursos by Malboa");
		allWoodObjects = $(page).find(".res.wood,.warn_90.wood,.warn.wood");
		allClayObjects = $(page).find(".res.stone,.warn_90.stone,.warn.stone");
		allIronObjects = $(page).find(".res.iron,.warn_90.iron,.warn.iron")
		allVillages = $(page).find(".quickedit-vn");
		//grabbing wood amounts
		for (var i = 0; i < allWoodObjects.length; i++) {
			n = allWoodObjects[i].textContent;
			n = n.replace(/\./g, '').replace(',', '');
			allWoodTotals.push(n);
		};


		//grabbing clay amounts
		for (var i = 0; i < allClayObjects.length; i++) {
			n = allClayObjects[i].textContent;
			n = n.replace(/\./g, '').replace(',', '');
			allClayTotals.push(n);
		};


		//grabbing iron amounts
		for (var i = 0; i < allIronObjects.length; i++) {
			n = allIronObjects[i].textContent;
			n = n.replace(/\./g, '').replace(',', '');
			allIronTotals.push(n);
		};


		//grabbing warehouse capacity
		for (var i = 0; i < allVillages.length; i++) {
			warehouseCapacity.push(allIronObjects[i].parentElement.nextElementSibling.innerHTML);
		};

		//grabbing available merchants and total merchants
		for (var i = 0; i < allVillages.length; i++) {
			availableMerchants.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[1]);
			totalMerchants.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[2]);
		};

		//grabbing used farmspace and total farmspace
		for (var i = 0; i < allVillages.length; i++) {
			farmSpaceUsed.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[1]);
			farmSpaceTotal.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[2]);
		};


        //making one big array to work with
        for (var i = 0; i < allVillages.length; i++) {
            villagesData.push({
                "id": allVillages[i].dataset.id,
                "url": allVillages[i].children[0].children[0].href,
                "coord": allVillages[i].innerText.trim().match(/\d+\|\d+/)[0],
                "name": allVillages[i].innerText.trim(),
                "wood": allWoodTotals[i],
                "stone": allClayTotals[i],
                "iron": allIronTotals[i],
                "availableMerchants": availableMerchants[i],
                "totalMerchants": totalMerchants[i],
                "warehouseCapacity": warehouseCapacity[i],
                "farmSpaceUsed": farmSpaceUsed[i],
                "farmSpaceTotal": farmSpaceTotal[i]
            });
        };
		
		sessionStorage.setItem("coordinateEnviarRecurso", coordinate);
		targetID = coordToId(coordinate);
	});
	
	//sleep(900000);
//}
function calculateResAmounts(wood, stone, iron, warehouse, merchants) {
    var merchantCarry = merchants * 1000;
    //available to use resources in village and substracting what we wanna leave behind
    leaveBehindRes = Math.floor(warehouse / 100 * resLimit);
    var localWood = wood - leaveBehindRes;
    var localStone = stone - leaveBehindRes;
    var localIron = iron - leaveBehindRes;
    localWood = Math.max(0, localWood);
    localStone = Math.max(0, localStone);
    localIron = Math.max(0, localIron);



    //recalculate how much can be sent according to how much is available
    //how much the merchant can take maximum
    merchantWood = (merchantCarry * woodPercentage);
    merchantStone = (merchantCarry * stonePercentage);
    merchantIron = (merchantCarry * ironPercentage);

    //check each type if we have enough available
    var perc = 1;
    if (merchantWood > localWood) {
        perc = localWood / merchantWood;
        merchantWood = merchantWood * perc;
        merchantStone = merchantStone * perc;
        merchantIron = merchantIron * perc;
    }
    if (merchantStone > localStone) {
        perc = localStone / merchantStone;
        merchantWood = merchantWood * perc;
        merchantStone = merchantStone * perc;
        merchantIron = merchantIron * perc;
    }
    if (merchantIron > localIron) {
        perc = localIron / merchantIron;
        merchantWood = merchantWood * perc;
        merchantStone = merchantStone * perc;
        merchantIron = merchantIron * perc;
    }
    thisVillaData = { "wood": Math.floor(merchantWood), "stone": Math.floor(merchantStone), "iron": Math.floor(merchantIron) }
    return thisVillaData;

}

function sendResource(sourceID, targetID, woodAmount, stoneAmount, ironAmount) {
    var e = { "target_id": targetID, "wood": woodAmount, "stone": stoneAmount, "iron": ironAmount };
    TribalWars.post("market", {
        ajaxaction: "map_send", village: sourceID
    }, e, function (e) {
        Dialog.close(),
        console.log(e.message)
        //totalWoodSent += woodAmount;
        //totalStoneSent += stoneAmount;
        //totalIronSent += ironAmount;
        //$("#woodSent").eq(0).text(`${numberWithCommas(totalWoodSent)}`);
        //$("#stoneSent").eq(0).text(`${numberWithCommas(totalStoneSent)}`);
        //$("#ironSent").eq(0).text(`${numberWithCommas(totalIronSent)}`);
       },
        !1
    );
    
}

function numberWithCommas(x) {
    // add . to make numbers more readable
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1.$2");
    return x;
}

async function coordToId(coordinate) {
    //get village data from the coordinate we gained from the user
    if (game_data.player.sitter > 0) {
        sitterID = `game.php?t=${game_data.player.id}&screen=api&ajax=target_selection&input=${coordinate}&type=coord`;
    }
    else {
        sitterID = '/game.php?&screen=api&ajax=target_selection&input=' + coordinate + '&type=coord';
    }
    var data;
    await $.get(sitterID, function (json) {
        if(parseFloat(game_data.majorVersion)>8.217)data = json;
        else data=JSON.parse(json);

    }).done(async function(){
        sendBack = [data.villages[0].id, data.villages[0].name, data.villages[0].image, data.villages[0].player_name, data.villages[0].points, data.villages[0].x, data.villages[0].y];
		for (var i = 0; i < villagesData.length; i++) {
			res = calculateResAmounts(villagesData[i].wood, villagesData[i].stone, villagesData[i].iron, villagesData[i].warehouseCapacity, villagesData[i].availableMerchants);
			if (res.wood + res.stone + res.iron != 0 && villagesData[i].id != sendBack[0]) {
				tempo = villagesData.length - i;
				tempo = tempo * timeExecucao;
				tempo = tempo / 1000;
				console.log(tempo);
				let seconds = Math.floor(tempo);
				UI.SuccessMessage(`Enviando para (${coordinate}): (${i + 1}/${villagesData.length}): <span class="icon header wood"> </span>${res.wood.toLocaleString('pt-BR')}, <span class="icon header stone"></span>${res.stone.toLocaleString('pt-BR')}, <span class="icon header iron"></span>${res.iron.toLocaleString('pt-BR')} <br> Tempo restante: ${seconds} segundos`, timeExecucao);
				sendResource(villagesData[i].id,sendBack[0],res.wood,res.stone,res.iron)
				totalWoodSent += res.wood;
				totalStoneSent += res.stone;
				totalIronSent += res.iron;
				await sleep(timeExecucao);
			}
			if ((i + 1) == villagesData.length) {
				UI.SuccessMessage(`Enviado para (${coordinate}): <span class="icon header wood"> </span>${totalWoodSent.toLocaleString('pt-BR')}, <span class="icon header stone"></span>${totalStoneSent.toLocaleString('pt-BR')}, <span class="icon header iron"></span>${totalIronSent.toLocaleString('pt-BR')}`, 5000)
			}
		}
    })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}