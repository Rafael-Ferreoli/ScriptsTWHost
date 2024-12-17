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

    // Quantidades fixas a serem enviadas
    var fixedWood = 28000;
    var fixedStone = 30000;
    var fixedIron = 25000;

    // Quantidade de recursos que devem ficar na aldeia
    leaveBehindRes = Math.floor(warehouse / 100 * resLimit);

    // Calcula o máximo disponível na aldeia após deixar recursos para trás
    var localWood = Math.max(0, wood - leaveBehindRes);
    var localStone = Math.max(0, stone - leaveBehindRes);
    var localIron = Math.max(0, iron - leaveBehindRes);

    // Garante que não ultrapasse a capacidade dos comerciantes
    var maxCarry = merchantCarry;
    var totalRequested = fixedWood + fixedStone + fixedIron;

    var scaleFactor = 1;
    if (totalRequested > maxCarry) {
        scaleFactor = maxCarry / totalRequested;
    }

    // Calcula as quantidades finais com base nos recursos disponíveis e limite de comerciantes
    var sendWood = Math.min(localWood, Math.floor(fixedWood * scaleFactor));
    var sendStone = Math.min(localStone, Math.floor(fixedStone * scaleFactor));
    var sendIron = Math.min(localIron, Math.floor(fixedIron * scaleFactor));

    return { 
        "wood": sendWood, 
        "stone": sendStone, 
        "iron": sendIron 
    };
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
