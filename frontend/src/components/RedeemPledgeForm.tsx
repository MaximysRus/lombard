import { useState, useEffect } from 'react';
import { 
  Box, Typography, FormControl, InputLabel, Select, MenuItem, 
  Card, CardContent, CardActions, Button, Divider, Chip, Stack
} from '@mui/material';
import { useAppStore } from '../store';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

export default function RedeemPledgeForm() {
  const { clients, setClients, redeemForm, setRedeemForm } = useAppStore();
  const { selectedClientId } = redeemForm;
  
  const [activePledges, setActivePledges] = useState<any[]>([]);

  useEffect(() => {
    if (clients.length === 0) {
      fetch(`${API_URL}/clients`).then(res => res.json()).then(setClients);
    }
  }, []);

  useEffect(() => {
    if (selectedClientId) fetchPledges();
    else setActivePledges([]);
  }, [selectedClientId]);

  const fetchPledges = () => {
    fetch(`${API_URL}/clients/${selectedClientId}/active-pledges`)
      .then(res => res.json())
      .then(setActivePledges);
  };

  const handleRedeem = async (pledgeId: number) => {
    if (!window.confirm('Оформить выкуп данного залога?')) return;
    const res = await fetch(`${API_URL}/pledges/${pledgeId}/redeem`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      alert(`✅ Залог успешно выкуплен!\nИтоговая сумма: ${data.redeemSum} руб.`);
      fetchPledges(); 
    } else {
      const err = await res.json();
      alert(`❌ Ошибка: ${err.message}`);
    }
  };

  const previewRedemption = (pledge: any) => {
    const { totalLoan, dueDate, tariff } = pledge;
    const baseInterest = totalLoan * (tariff.basePeriodRate / 100);
    
    let overdueDays = 0;
    let overdueInterest = 0;

    const due = new Date(dueDate).setHours(0,0,0,0);
    const current = new Date().setHours(0,0,0,0);

    if (current > due) {
      const diffTime = Math.abs(current - due);
      overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      overdueInterest = totalLoan * (tariff.overdueRate / 100) * overdueDays;
    }

    return {
      total: (totalLoan + baseInterest + overdueInterest).toFixed(2),
      baseInterest: baseInterest.toFixed(2),
      overdueInterest: overdueInterest.toFixed(2),
      overdueDays
    };
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Выкуп залога</Typography>
      
      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel id="redeem-client-label">Выберите клиента</InputLabel>
        <Select 
          labelId="redeem-client-label" label="Выберите клиента"
          value={selectedClientId || ''} 
          onChange={e => setRedeemForm({ selectedClientId: e.target.value })}
        >
          {clients.map(c => <MenuItem key={c.id} value={c.id}>{c.fullName} ({c.phone})</MenuItem>)}
        </Select>
      </FormControl>

      {selectedClientId && activePledges.length === 0 && (
        <Typography color="text.secondary">У данного клиента нет активных залогов.</Typography>
      )}

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 3 }}>
        {activePledges.map(pledge => {
          const calc = previewRedemption(pledge);
          const isOverdue = calc.overdueDays > 0;
          
          return (
            <Card key={pledge.id} elevation={2} sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' }, display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">Билет №{pledge.id}</Typography>
                  <Chip size="small" label={isOverdue ? 'Просрочен' : 'Активен'} color={isOverdue ? 'error' : 'success'} />
                </Box>
                
                <Typography variant="body2" color="text.secondary">Срок до: <strong>{new Date(pledge.dueDate).toLocaleDateString()}</strong></Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>Займ: <strong>{pledge.totalLoan} руб.</strong></Typography>
                
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2">Базовый процент: +{calc.baseInterest} руб.</Typography>
                {isOverdue && <Typography variant="body2" color="error.main">Просрочка: +{calc.overdueInterest} руб.</Typography>}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle1"><strong>Итого к оплате:</strong></Typography>
                  <Typography variant="subtitle1"><strong>{calc.total} руб.</strong></Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button fullWidth variant="contained" color="success" onClick={() => handleRedeem(pledge.id)}>Провести выкуп</Button>
              </CardActions>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}