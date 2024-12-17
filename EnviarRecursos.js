if (!coordinate) {
    coordinate = '605|490';
}

var totalWoodSent = 0, totalStoneSent = 0, totalIronSent = 0;
var timeExecucao = 75; // Delay entre execuções
var fixedWood = 28000, fixedClay = 30000, fixedIron = 25000;
var requiredMerchants = 83; // Número fixo de mercadores necessários

if (game_data.player.sitter > 0) {
    URLReq = `game.php?t=${game_data.player.id}&screen=overview_villages&mode=prod&group=${grupoExecucao}`;
} else {
    URLReq = `game.php?&screen=overview_villages&mode=prod&group=${grupoExecucao}`;
}

$.get(URLReq, function () {
    console.log("Página carregada com sucesso");
}).done(function (page) {
    console.log("Iniciando envio fixo de recursos");

    var allVillages = $(page).find(".quickedit-vn");
    var availableMerchants = [];
    var villagesData = [];

    // Coletar dados dos mercadores disponíveis
    for (var i = 0; i < allVillages.length; i++) {
        var merchantsText = allVillages[i].parentElement.nextElementSibling.nextElementSibling.innerText;
        var available = merchantsText.match(/(\d*)\/(\d*)/)[1];
        availableMerchants.push(parseInt(available));
    }

    // Armazenar dados das aldeias
    for (var i = 0; i < allVillages.length; i++) {
        villagesData.push({
            "id": allVillages[i].dataset.id,
            "availableMerchants": availableMerchants[i]
        });
    }

    // Converter coordenada para ID de destino
    sessionStorage.setItem("coordinateEnviarRecurso", coordinate);
    coordToId(coordinate).then(function (targetID) {
        for (var i = 0; i < villagesData.length; i++) {
            let village = villagesData[i];
            
            if (village.availableMerchants >= requiredMerchants) {
                UI.SuccessMessage(
                    `Enviando recursos fixos de (${village.id}) para (${coordinate}): ` +
                    `<span class="icon header wood"></span> ${fixedWood.toLocaleString('pt-BR')}, ` +
                    `<span class="icon header stone"></span> ${fixedClay.toLocaleString('pt-BR')}, ` +
                    `<span class="icon header iron"></span> ${fixedIron.toLocaleString('pt-BR')}`,
                    timeExecucao
                );

                sendResource(village.id, targetID, fixedWood, fixedClay, fixedIron);
                totalWoodSent += fixedWood;
                totalStoneSent += fixedClay;
                totalIronSent += fixedIron;
            } else {
                console.log(`Aldeia ${village.id} não tem mercadores suficientes (${village.availableMerchants}/83).`);
            }
        }

        UI.SuccessMessage(
            `Envio concluído para (${coordinate}): ` +
            `<span class="icon header wood"></span> ${totalWoodSent.toLocaleString('pt-BR')}, ` +
            `<span class="icon header stone"></span> ${totalStoneSent.toLocaleString('pt-BR')}, ` +
            `<span class="icon header iron"></span> ${totalIronSent.toLocaleString('pt-BR')}`,
            5000
        );
    });
});

function sendResource(sourceID, targetID, woodAmount, stoneAmount, ironAmount) {
    var payload = { "target_id": targetID, "wood": woodAmount, "stone": stoneAmount, "iron": ironAmount };
    TribalWars.post("market", { ajaxaction: "map_send", village: sourceID }, payload, function (response) {
        Dialog.close();
        console.log(response.message);
    }, false);
}

async function coordToId(coordinate) {
    var url = game_data.player.sitter > 0
        ? `game.php?t=${game_data.player.id}&screen=api&ajax=target_selection&input=${coordinate}&type=coord`
        : `/game.php?&screen=api&ajax=target_selection&input=${coordinate}&type=coord`;

    var data;
    await $.get(url, function (json) {
        data = parseFloat(game_data.majorVersion) > 8.217 ? json : JSON.parse(json);
    });

    return data.villages[0].id;
}
