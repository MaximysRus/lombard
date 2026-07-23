import React, { useEffect } from 'react';
import { 
  Box, Button, TextField, Select, MenuItem, InputLabel, FormControl, 
  Typography, Checkbox, FormControlLabel, Paper, Divider, Stack 
} from '@mui/material';
import { useAppStore } from '../store';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

export default function CreatePledgeForm() {
  const { 
    tariffs, categories, clients, 
    setTariffs, setCategories, setClients,
    createForm, setCreateForm, resetCreateForm 
  } = useAppStore();

  const { selectedTariffId, clientId, isNewClient, newClientName, newClientPhone, items } = createForm;

  const availableCategories = categories.filter(c => c.tariffId === Number(selectedTariffId));

  useEffect(() => {
    if (tariffs.length === 0) {
      fetch(`${API_URL}/tariffs`).then(res => res.json()).then(setTariffs);
      fetch(`${API_URL}/categories`).then(res => res.json()).then(setCategories);
      fetch(`${API_URL}/clients`).then(res => res.json()).then(setClients);
    }
  }, []);

  const selectedTariff = tariffs.find(t => t.id === Number(selectedTariffId));
  const dueDate = selectedTariff ? new Date(Date.now() + selectedTariff.basePeriodDays * 24 * 60 * 60 * 1000).toLocaleDateString() : '';

  const handleAddItem = () => {
    setCreateForm({ items: [...items, { categoryId: '', name: '', attributesData: {}, estimatedValue: 0 }] });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'categoryId') newItems[index].attributesData = {};
    setCreateForm({ items: newItems });
  };

  const handleAttributeChange = (index: number, attr: string, value: string) => {
    const newItems = [...items];
    newItems[index].attributesData[attr] = value;
    setCreateForm({ items: newItems });
  };

  const validateForm = () => {
    if (!selectedTariffId) return 'Выберите тариф';
    if (isNewClient && (!newClientName.trim() || !newClientPhone.trim())) return 'Заполните ФИО и телефон нового клиента';
    if (!isNewClient && !clientId) return 'Выберите существующего клиента';
    if (items.length === 0) return 'Добавьте хотя бы один предмет залога';

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.categoryId) return `Предмет №${i + 1}: Выберите категорию`;
      if (!item.name.trim()) return `Предмет №${i + 1}: Укажите наименование`;
      if (Number(item.estimatedValue) <= 0) return `Предмет №${i + 1}: Оценочная стоимость должна быть больше 0`;

      const cat = categories.find(c => c.id === Number(item.categoryId));
      if (cat?.attributes) {
        for (const attr of cat.attributes) {
          if (!item.attributesData[attr] || !item.attributesData[attr].trim()) {
            return `Предмет №${i + 1}: Заполните характеристику "${attr}"`;
          }
        }
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errorMsg = validateForm();
    if (errorMsg) return alert(`❌ Ошибка валидации:\n${errorMsg}`);

    let finalClientId = clientId;

    if (isNewClient) {
      const res = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: newClientName, phone: newClientPhone })
      });
      const newClient = await res.json();
      finalClientId = newClient.id;
      setClients([...clients, newClient]);
    }

    const payload = {
      tariffId: Number(selectedTariffId),
      clientId: Number(finalClientId),
      items: items.map(i => ({ ...i, categoryId: Number(i.categoryId), estimatedValue: Number(i.estimatedValue) }))
    };

    const res = await fetch(`${API_URL}/pledges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('✅ Залог успешно создан!');
      resetCreateForm();
    } else {
      const err = await res.json();
      alert(`❌ Ошибка бэкенда: ${err.message || 'Неизвестная ошибка'}`);
    }
  };

  const totalLoan = items.reduce((sum, item) => sum + Number(item.estimatedValue || 0), 0);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>Новый залог</Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Контрагент</Typography>
        <FormControlLabel 
          control={<Checkbox checked={isNewClient} onChange={(e) => setCreateForm({ isNewClient: e.target.checked })} />} 
          label="Зарегистрировать нового клиента" 
        />
        <Box sx={{ mt: 2 }}>
          {isNewClient ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField fullWidth label="ФИО" value={newClientName} onChange={e => setCreateForm({ newClientName: e.target.value })} />
              <TextField fullWidth label="Телефон" value={newClientPhone} onChange={e => setCreateForm({ newClientPhone: e.target.value })} />
            </Stack>
          ) : (
            <FormControl fullWidth>
              <InputLabel id="client-label">Выберите клиента</InputLabel>
              <Select labelId="client-label" label="Выберите клиента" value={clientId || ''} onChange={e => setCreateForm({ clientId: e.target.value })}>
                {clients.map(c => <MenuItem key={c.id} value={c.id}>{c.fullName} ({c.phone})</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Тариф</Typography>
        <FormControl fullWidth>
          <InputLabel id="tariff-label">Выберите тариф</InputLabel>
          <Select
            labelId="tariff-label"
            label="Выберите тариф"
            value={selectedTariffId || ''}
            onChange={(e) => setCreateForm({ selectedTariffId: e.target.value, items: [] })} // Сброс товаров при смене тарифа
          >
            {tariffs.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </Select>
        </FormControl>
        
        {selectedTariff && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f7ff', borderRadius: 1 }}>
            <Typography variant="body1">Дата окончания: <strong>{dueDate}</strong> ({selectedTariff.basePeriodDays} дней)</Typography>
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Предметы залога</Typography>
        
        {items.map((item, index) => {
          const cat = categories.find(c => c.id === Number(item.categoryId));
          const attrs = cat?.attributes || []; 

          return (
            <Box key={index} sx={{ mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
                <FormControl fullWidth>
                  <InputLabel id={`cat-label-${index}`}>Категория</InputLabel>
                  <Select 
                    labelId={`cat-label-${index}`} label="Категория" 
                    value={item.categoryId || ''} 
                    onChange={e => handleItemChange(index, 'categoryId', e.target.value)}
                  >
                    {availableCategories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
                
                <TextField fullWidth label="Наименование" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} />
                <TextField fullWidth type="number" label="Оценка (₽)" value={item.estimatedValue || ''} onChange={e => handleItemChange(index, 'estimatedValue', e.target.value)} />
                <Button color="error" onClick={() => setCreateForm({ items: items.filter((_, i) => i !== index) })}>Удалить</Button>
              </Stack>

              {attrs.length > 0 && (
                <Box sx={{ mt: 2, pl: 2, borderLeft: '3px solid #1976d2' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Характеристики:</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                    {attrs.map((attr: string) => (
                      <TextField key={attr} size="small" label={attr} sx={{ minWidth: '200px' }} value={item.attributesData[attr] || ''} onChange={e => handleAttributeChange(index, attr, e.target.value)} />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          );
        })}
        
        <Button variant="outlined" onClick={handleAddItem} sx={{ mt: 1 }}>+ Добавить предмет</Button>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" align="right">Итого сумма займа: <strong>{totalLoan} руб.</strong></Typography>
      </Paper>

      <Button type="submit" variant="contained" size="large" sx={{ py: 1.5 }}>Оформить залог</Button>
    </Box>
  );
}