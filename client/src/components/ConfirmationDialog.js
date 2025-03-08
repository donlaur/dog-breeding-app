import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

/**
 * A reusable confirmation dialog component for destructive actions
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when dialog is closed without confirming
 * @param {Function} props.onConfirm - Function to call when user confirms the action
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message
 * @param {string} props.confirmButtonText - Text for the confirm button
 * @param {string} props.cancelButtonText - Text for the cancel button
 * @param {string} props.severity - Severity level ('error', 'warning', 'info', 'success')
 */
const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  severity = "warning"
}) => {
  // Map severity to color
  const severityColors = {
    error: "error",
    warning: "warning",
    info: "info",
    success: "success"
  };
  const color = severityColors[severity] || severityColors.warning;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color={color} />
        <Typography component="span">{title}</Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirmation-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {cancelButtonText}
        </Button>
        <Button 
          onClick={onConfirm} 
          color={color}
          variant="contained"
          autoFocus
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog; 