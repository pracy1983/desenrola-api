import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const port = process.env.PORT || 5005;

app.use(cors({
  origin: ['http://localhost:5173', 'https://desenrola.netlify.app']
}));
app.use(express.json());

const asaasApi = axios.create({
  baseURL: 'https://sandbox.asaas.com/api/v3',
  headers: {
    'access_token': process.env.ASAAS_API_KEY
  }
});

// Criar cliente
app.post('/api/asaas/customers', async (req, res) => {
  try {
    const { name, email, cpfCnpj } = req.body;
    const response = await asaasApi.post('/customers', {
      name,
      email,
      cpfCnpj
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error creating customer:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Criar assinatura
app.post('/api/asaas/subscriptions', async (req, res) => {
  try {
    const { email, planId } = req.body;
    
    // Buscar ou criar cliente
    let customer;
    const customersResponse = await asaasApi.get('/customers', {
      params: { email }
    });
    
    if (customersResponse.data.data && customersResponse.data.data.length > 0) {
      customer = customersResponse.data.data[0];
    } else {
      const newCustomer = await asaasApi.post('/customers', { email });
      customer = newCustomer.data;
    }

    // Criar assinatura
    const subscription = await asaasApi.post('/subscriptions', {
      customer: customer.id,
      billingType: 'CREDIT_CARD',
      value: planId === 'weekly' ? 8.99 : 34.99,
      nextDueDate: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0], // amanhã
      cycle: planId === 'weekly' ? 'WEEKLY' : 'MONTHLY',
      description: `Plano ${planId === 'weekly' ? 'Semanal' : 'Mensal'} Dr. Desenrola`
    });

    res.json(subscription.data);
  } catch (error) {
    console.error('Error creating subscription:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
