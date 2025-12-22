import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  IconButton,
  Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form State matching the Schema
  const [formData, setFormData] = useState({
    name: "",
    propertyType: "",
    location: "",
    developer: "",
    priceRange: "",
    unitSize: "",
    unitType: "", // e.g., 1BR, 2BR
    handoverDate: "",
    description: "",
    isActive: true,
  });

  // Fetch Properties
  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/properties`);
      setProperties(res.data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Open Dialog
  const handleOpen = (property = null) => {
    if (property) {
      setFormData({
        name: property.name,
        propertyType: property.propertyType || "",
        location: property.location,
        developer: property.developer || "",
        priceRange: property.priceRange || "",
        unitSize: property.unitSize || "",
        unitType: property.unitType || "",
        handoverDate: property.handoverDate || "",
        description: property.description || "",
        isActive: property.isActive,
      });
      setCurrentId(property._id);
      setIsEdit(true);
    } else {
      // Reset
      setFormData({
        name: "",
        propertyType: "",
        location: "",
        developer: "",
        priceRange: "",
        unitSize: "",
        unitType: "",
        handoverDate: "",
        description: "",
        isActive: true,
      });
      setIsEdit(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentId(null);
  };

  // Submit Form
  const handleSubmit = async () => {
    try {
      if (isEdit) {
        await axios.put(`${API_URL}/api/properties/${currentId}`, formData);
      } else {
        await axios.post(`${API_URL}/api/properties`, formData);
      }
      fetchProperties();
      handleClose();
    } catch (err) {
      console.error("Error saving property:", err);
      alert("Failed to save property. Check console.");
    }
  };

  // Delete Property
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        await axios.delete(`${API_URL}/api/properties/${id}`);
        fetchProperties();
      } catch (err) {
        console.error("Error deleting property:", err);
      }
    }
  };

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" gutterBottom>
          Properties / Projects
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Property
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Developer</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Loc</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Handover</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {properties.map((p) => (
              <TableRow key={p._id}>
                <TableCell>
                  <Typography variant="subtitle2">{p.name}</Typography>
                </TableCell>
                <TableCell>{p.developer}</TableCell>
                <TableCell>
                  {p.propertyType} {p.unitType ? `(${p.unitType})` : ""}
                </TableCell>
                <TableCell>{p.location}</TableCell>
                <TableCell>{p.priceRange}</TableCell>
                <TableCell>{p.handoverDate}</TableCell>
                <TableCell>
                  {p.isActive ? (
                    <Typography color="green">Active</Typography>
                  ) : (
                    <Typography color="error">Inactive</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(p)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(p._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {properties.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No properties found. Add one!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? "Edit Property" : "Add Property"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} pt={1}>
            {/* Row 1 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Property/Project Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Developer"
                name="developer"
                value={formData.developer}
                onChange={handleChange}
              />
            </Grid>
            {/* Row 2 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Property Type (e.g. Villa)"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit Type (e.g. 1BR, 2BR)"
                name="unitType"
                value={formData.unitType}
                onChange={handleChange}
              />
            </Grid>
            {/* Row 3 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price Range"
                name="priceRange"
                value={formData.priceRange}
                onChange={handleChange}
                placeholder="e.g. AED 1.5M - 3M"
              />
            </Grid>
            {/* Row 4 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit Size"
                name="unitSize"
                value={formData.unitSize}
                onChange={handleChange}
                placeholder="e.g. 1,200 sqft"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Handover Date"
                name="handoverDate"
                value={formData.handoverDate}
                onChange={handleChange}
                placeholder="e.g. Q4 2026"
              />
            </Grid>

            {/* Row 5 - Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description / Selling Points"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                placeholder="Key details for the AI to know..."
              />
            </Grid>

            {/* Row 6 - Active */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="Is Active (Visible to AI)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {isEdit ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Properties;
