import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'CeLiLac Backend' });
});

app.listen(port, () => {
  console.log(`[Server]: CeLiLac Backend is running at http://localhost:${port}`);
});
