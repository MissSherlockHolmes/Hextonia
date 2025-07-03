const express = require('express');
const { selectForms } = require('./formSelector');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// POST /api/select-forms
app.post('/api/select-forms', (req, res) => {
    const { forms, correctForm } = req.body;
    try {
        const result = selectForms(forms, correctForm);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.send('API server is running.');
});

app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
}); 