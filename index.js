import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Asaas } from 'asaas-node';

dotenv.config();

const app = express();
const port = process.env.PORT || 5005;

app.use(cors({
  origin: ['http://localhost:5173', 'https://desenrola.netlify.app']
}));
app.use(express.json());

const asaas = new Asaas(process.env.ASAAS_API_KEY);

// Criar cliente
app.post('/api/asaas/customers', async (req, res) => {
  try {
    const { name, email, cpfCnpj } = req.body;
    const customer = await asaas.customers.create({
      name,
      email,
      cpfCnpj
    });
    res.json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar assinatura
app.post('/api/asaas/subscriptions', async (req, res) => {
  try {
    const { email, planId } = req.body;
    
    // Buscar ou criar cliente
    let customer;
    const customers = await asaas.customers.list({ email });
    
    if (customers.data && customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await asaas.customers.create({ email });
    }

    // Criar assinatura
    const subscription = await asaas.subscriptions.create({
      customer: customer.id,
      billingType: 'CREDIT_CARD',
      value: planId === 'weekly' ? 8.99 : 34.99,
      nextDueDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0], // amanhã
      cycle: planId === 'weekly' ? 'WEEKLY' : 'MONTHLY',
      description: `Plano ${planId === 'weekly' ? 'Semanal' : 'Mensal'} Dr. Desenrola`
    });

    res.json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
