import React from "react";
import { TextField, MenuItem, Grid, Typography } from "@mui/material";
import { formatDateForInput } from "../../utils/publicUtils";

const WorkAuthorization = ({ formData, handleChange }) => {
  const isNonResident = formData.visaStatus?.citizenship === "no";
  const isF1Visa = formData.visaStatus?.visaTitle === "F1 (CPT/OPT)";
  const isOtherVisa = formData.visaStatus?.visaTitle === "Other";

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Work Authorization
        </Typography>
      </Grid>

      {/* Citizenship Question */}
      <Grid item xs={12} sm={6}>
        <Typography variant="body2" sx={{ marginBottom: 1 }}>
          Are you a U.S citizen or permanent resident?
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Yes / No"
          select
          name="visaStatus.citizenship"
          value={formData.visaStatus?.citizenship || ""}
          onChange={handleChange}
          fullWidth
          required
        >
          <MenuItem value="yes">Yes</MenuItem>
          <MenuItem value="no">No</MenuItem>
        </TextField>
      </Grid>

      {/* If "Yes" is selected */}
      {formData.visaStatus?.citizenship === "yes" && (
        <Grid item xs={12} sm={6}>
          <TextField
            label="Select your status"
            select
            name="visaStatus.citizenshipType"
            value={formData.visaStatus?.citizenshipType}
            onChange={handleChange}
            fullWidth
            required
          >
            <MenuItem value="citizen">Citizen</MenuItem>
            <MenuItem value="green card">Green Card</MenuItem>
          </TextField>
        </Grid>
      )}

      {/* If "No" is selected */}
      {isNonResident && (
        <>
          <Grid item xs={12} sm={6}>
            <TextField
              label="What is your work authorization?"
              select
              name="visaStatus.visaTitle"
              value={formData.visaStatus?.visaTitle}
              onChange={handleChange}
              fullWidth
              required
            >
              <MenuItem value="H1-B">H1-B</MenuItem>
              <MenuItem value="L2">L2</MenuItem>
              <MenuItem value="F1 (CPT/OPT)">F1 (CPT/OPT)</MenuItem>
              <MenuItem value="H4">H4</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Grid>

          {/* If F1 (CPT/OPT) is selected */}
          {isF1Visa && (
            <Grid item xs={12} sm={6}>
              <TextField
                label="OPT Receipt"
                name="optReceipt"
                type="file"
                onChange={handleChange}
                fullWidth
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            </Grid>
          )}

          {/* If "Other" is selected */}
          {isOtherVisa && (
            <Grid item xs={12} sm={6}>
              <TextField
                label="Specify Visa Title"
                name="visaStatus.specificVisaTitle"
                value={formData.visaStatus?.specificVisaTitle || ""}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
              />
            </Grid>
          )}

          {/* Visa Start and End Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Visa Start Date"
              name="visaStatus.startDate"
              type="date"
              value={formatDateForInput(formData.visaStatus?.startDate)}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Visa End Date"
              name="visaStatus.endDate"
              type="date"
              value={formatDateForInput(formData.visaStatus?.endDate)}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              margin="normal"
            />
          </Grid>

          {/* Visa Documents Upload */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Work Authorization Document"
              name="visaDocuments"
              type="file"
              onChange={handleChange}
              fullWidth
              inputProps={{ multiple: true }}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
              required
            />
          </Grid>
        </>
      )}
    </>
  );
};

export default WorkAuthorization;
