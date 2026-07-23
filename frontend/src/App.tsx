import { useState } from 'react';
import { AppBar, Toolbar, Typography, Container, Box, Tabs, Tab, Paper } from '@mui/material';
import CreatePledgeForm from './components/CreatePledgeForm';
import RedeemPledgeForm from './components/RedeemPledgeForm';

function App() {
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" component="header">
        <Toolbar>
          <Typography variant="h6" component="h1">
            Ломбард: Управление залогами
          </Typography>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="md" sx={{ flexGrow: 1, py: 4 }}>
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
              <Tab label="Оформление залога" />
              <Tab label="Выкуп залога" />
            </Tabs>
          </Box>
          
          <Box component="section" sx={{ p: 4, bgcolor: 'white' }}>
            {activeTab === 0 && <CreatePledgeForm />}
            {activeTab === 1 && <RedeemPledgeForm />}
          </Box>
        </Paper>
      </Container>

      <Box component="footer" sx={{ py: 3, bgcolor: '#e0e0e0', textAlign: 'center', mt: 'auto' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Внутренняя система «Ломбард». Все права защищены.
        </Typography>
      </Box>
    </Box>
  );
}

export default App;