const express = require('express');
const multer = require('multer');
const pdf = require('pdf-extraction');
const cors = require('cors');

const app = express();
app.use(cors());

// Configura o multer para manter o PDF na memória (buffer)
const upload = multer({ storage: multer.memoryStorage() });

app.post('/calcular-horas', upload.single('relatorio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ erro: "Nenhum arquivo enviado." });
    }

    try {
        // Lê diretamente do buffer gerado pelo Multer
        const data = await pdf(req.file.buffer);
        let texto = data.text;

        texto = texto.replace(/Página \d+ de \d+\s*\d{2}:\d{2}/g, '');
        texto = texto.replace(/15:07/g, ''); 

        const regexHora = /(?:[01]\d|2[0-3]):[0-5]\d/g;
        const todosOsHorarios = texto.match(regexHora);

        if (!todosOsHorarios || todosOsHorarios.length === 0) {
            return res.json({ totalHoras: "00:00", pares: 0 });
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
        const totalFormatado = `${String(horasTotais).padStart(2, '0')}:${String(minutosRestantes).padStart(2, '0')}`;

        res.json({ 
            totalHoras: totalFormatado, 
            paresProcessados: Math.floor(todosOsHorarios.length / 2) 
        });

    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

app.listen(3000, () => {
    console.log('API rodando em http://localhost:3000');
});