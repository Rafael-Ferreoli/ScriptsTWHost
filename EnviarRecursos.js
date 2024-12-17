if (!coordinate) {
	coordinate = '605|490';
}

const MERCHANTS_LIMIT = 83; // Quantidade fixa de mercadores a serem usados
const FIXED_WOOD = 28000;   // Quantidade fixa de madeira
const FIXED_CLAY = 30000;   // Quantidade fixa de argila
const FIXED_IRON = 25000;   // Quantidade fixa de ferro
const MERCHANT_CAPACITY = 1000; // Capacidade de carga de cada mercador

var villagesData = [];
var totalWoodSent = 0, totalClaySent = 0, totalIronSent = 0;
var tempo = 0;
var timeExecucao = 75;

if (!grupoExecucao) {
	grupoExecucao = '70209';
}

var URLReq;
if (game_data.player.sitter > 0) {
    URLReq = `game.php?t=${game_data.player.id}&screen=overview_villages&mode=prod&group=${grupoExecucao}`;
} else {
    URLReq = `game.php?&screen=overview_villages&mode=prod&group=${grupoExecucao}`;
}

$.get(URLReq, function () {
    console.log("Managed to grab the page");
}).done(function (page) {
    console.log("Starting - Enviar Recursos Fixos");

    // Coletando dados das aldeias
    var allVillages = $(page).find(".quickedit-vn");
    var allMerchants = $(page).find(".merchants");

    for (var i = 0; i < allVillages.length; i++) {
        var availableMerchants = parseInt(allMerchants[i].textContent.match(/(\d+)\/\d+/)[1]);

        villagesData.push({
            "id": allVillages[i].dataset.id,
            "url": allVillages[i].children[0].children[0].href,
            "name": allVillages[i].innerText.trim(),
            "availableMerchants": availableMerchants
        });
    }

    // Processar envio de recursos
    sessionStorage.setItem("coordinateEnviarRecurso", coordinate);
    coordToId(coordinate).then(targetID => {
        for (var i = 0; i < villagesData.length; i++) {
            if (villagesData[i].availableMerchants >= MERCHANTS_LIMIT) {
                console.log(`Enviando recursos fixos da aldeia: ${villagesData[i].name}`);
                sendResource(villagesData[i].id, targetID, FIXED_WOOD, FIXED_CLAY, FIXED_IRON);
                totalWoodSent += FIXED_WOOD;
                totalClaySent += FIXED_CLAY;
                totalIronSent += FIXED_IRON;

                UI.SuccessMessage(`Enviando para (${coordinate}): <span class="icon header wood"></span>${FIXED_WOOD.toLocaleString('pt-BR')}, <span class="icon header stone"></span>${FIXED_CLAY.toLocaleString('pt-BR')}, <span class="icon header iron"></span>${FIXED_IRON.toLocaleString('pt-BR')}`, timeExecucao);
            }
        }

        UI.SuccessMessage(`Envio concluído! Recursos totais enviados: <span class="icon header wood"></span>${totalWoodSent.toLocaleString('pt-BR')}, <span class="icon header stone"></span>${totalClaySent.toLocaleString('pt-BR')}, <span class="icon header iron"></span>${totalIronSent.toLocaleString('pt-BR')}`, 5000);
    });
});

// Função para envio de recursos
function sendResource(sourceID, targetID, woodAmount, clayAmount, ironAmount) {
    var e = { "target_id": targetID, "wood": woodAmount, "stone": clayAmount, "iron": ironAmount };
    TribalWars.post("market", {
        ajaxaction: "map_send", village: sourceID
    }, e, function (e) {
        console.log(`Recursos enviados: Madeira=${woodAmount}, Argila=${clayAmount}, Ferro=${ironAmount}`);
    }, false);
}

// Função para converter coordenada em ID
async function coordToId(coordinate) {
    var sitterID = game_data.player.sitter > 0
        ? `game.php?t=${game_data.player.id}&screen=api&ajax=target_selection&input=${coordinate}&type=coord`
        : `/game.php?&screen=api&ajax=target_selection&input=${coordinate}&type=coord`;

    let data = await $.get(sitterID);
    return parseFloat(game_data.majorVersion) > 8.217 ? data.villages[0].id : JSON.parse(data).villages[0].id;
}
