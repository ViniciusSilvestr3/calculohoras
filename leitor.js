const fs = require('fs');
const pdf = require('pdf-extraction');

async function calcularTotalHorasPDF(caminhoPDF) {
    try {
        const dataBuffer = fs.readFileSync(caminhoPDF);
        const data = await pdf(dataBuffer);

        let texto = data.text;

        // Se o texto vier muito curto ou vazio, avisa no console
        if (texto.trim().length < 50) {
            console.log("Aviso: O PDF parece não conter texto legível ou é uma imagem escaneada.");
            return;
        }

        // Remove o horário de impressão do rodapé para não entrar na conta
        texto = texto.replace(/Página \d+ de \d+\s*\d{2}:\d{2}/g, '');
        texto = texto.replace(/15:07/g, ''); 

        // Regex flexível: sem o '\b', encontra o horário mesmo se estiver colado em aspas ou vírgulas
        const regexHora = /(?:[01]\d|2[0-3]):[0-5]\d/g;
        const todosOsHorarios = texto.match(regexHora);

        if (!todosOsHorarios || todosOsHorarios.length === 0) {
            console.log("Nenhum horário encontrado no PDF. Veja as primeiras letras extraídas para entender o formato:");
            console.log(texto.substring(0, 300));
            return;
        }

        let totalMinutos = 0;

        for (let i = 0; i < todosOsHorarios.length; i += 2) {
            const inicio = todosOsHorarios[i];
            const termino = todosOsHorarios[i + 1];

            if (inicio && termino) {
                const [hInicio, mInicio] = inicio.split(':').map(Number);
                const [hTermino, mTermino] = termino.split(':').map(Number);

                let minInicio = (hInicio * 60) + mInicio;
                let minTermino = (hTermino * 60) + mTermino;

                if (minTermino < minInicio) minTermino += 24 * 60;

                totalMinutos += (minTermino - minInicio);
            }
        }

        const horasTotais = Math.floor(totalMinutos / 60);
        const minutosRestantes = totalMinutos % 60;

        console.log(`Pares processados: ${Math.floor(todosOsHorarios.length / 2)}`);
        console.log(`Total de horas processadas: ${String(horasTotais).padStart(2, '0')}:${String(minutosRestantes).padStart(2, '0')}`);

    } catch (erro) {
        console.error("Erro na leitura do arquivo:", erro.message);
    }
}

// Execução
calcularTotalHorasPDF('./XReport.pdf');