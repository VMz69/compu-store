import { Box, Typography, Paper, Chip, Switch, Button, IconButton } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { inventoryData } from './data/dummyInventory';

function App() {
  // Definición de las columnas para el DataGrid de MUI
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Producto', width: 250, flex: 1 },
    { field: 'category', headerName: 'Categoría', width: 150 },
    { 
      field: 'price', 
      headerName: 'Precio', 
      width: 130,
      renderCell: (params) => `$${params.value.toFixed(2)}`
    },
    { field: 'stock', headerName: 'Stock', width: 100 },
    {
      field: 'status',
      headerName: 'Estado',
      width: 150,
      renderCell: (params) => {
        let color: "success" | "default" | "error" | "warning" = "default";
        if (params.value === 'Disponible') color = "success";
        if (params.value === 'Pausado') color = "error";
        if (params.value === 'Stock Bajo') color = "warning";
        return <Chip label={params.value as string} color={color} size="small" />;
      },
    },
    {
      field: 'visibility',
      headerName: 'Visibilidad',
      width: 120,
      renderCell: (params) => (
        <Switch 
          size="small" 
          checked={params.row.status !== 'Pausado'} 
          color="primary"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      renderCell: () => (
        <Box>
          <IconButton color="primary" size="small"><EditIcon /></IconButton>
          <IconButton color="error" size="small"><DeleteIcon /></IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Navbar Superior */}
      <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          BackOffice (Panel de Control) - CompuStore
        </Typography>
        <Typography variant="body2">
          admin@cibercafe.local
        </Typography>
      </Box>

      {/* Contenido Principal */}
      <Box sx={{ p: 4, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" color="text.secondary">
            Gestión de Inventario
          </Typography>
          <Button variant="contained" color="primary">
            + Nuevo Producto
          </Button>
        </Box>

        {/* Tabla DataGrid */}
        <Paper sx={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={inventoryData}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 5 },
              },
            }}
            pageSizeOptions={[5, 10]}
            checkboxSelection
            disableRowSelectionOnClick
          />
        </Paper>
      </Box>
    </Box>
  );
}

export default App;