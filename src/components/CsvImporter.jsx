// components/CsvImporter.jsx
import React, { useState } from 'react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';
import { useShopStore } from '../store/shop-store';
import "../styles/products.css";

const CsvImporter = ({ onImportComplete, onLoadingChange }) => {
  const { shop } = useShopStore();
  const [isImporting, setIsImporting] = useState(false);

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Product Name',
        category: 'Category',
        quantity: '100',
        form: 'units',
        cost_price: '500.00',
        selling_price: '750.00',
        low_stock_alert: '10',
        barcode: '1234567890123'
      },
      {
        name: 'Example Product 1',
        category: 'electronics',
        quantity: '50',
        form: 'units',
        cost_price: '2500.00',
        selling_price: '3500.00',
        low_stock_alert: '5',
        barcode: '1234567890124'
      },
      {
        name: 'Example Product 2',
        category: 'clothing',
        quantity: '200',
        form: 'pieces',
        cost_price: '800.00',
        selling_price: '1500.00',
        low_stock_alert: '20',
        barcode: '1234567890125'
      }
    ];
    
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'product_import_template.csv');
    toast.success('Template downloaded successfully!');
  };

  const readCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvData = e.target.result;
          const results = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.toLowerCase().trim()
          });
          
          resolve(results.data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const validateProduct = (product, index) => {
    const errors = [];
    const name = product.name?.toString().trim();
    
    if (!name) {
      errors.push('Missing product name');
    }
    
    if (!product.category?.toString().trim()) {
      errors.push('Missing category');
    }
    
    const quantity = parseInt(product.quantity);
    if (isNaN(quantity) || quantity < 0) {
      errors.push('Invalid quantity');
    }
    
    const costPrice = parseFloat(product.cost_price);
    if (isNaN(costPrice) || costPrice < 0) {
      errors.push('Invalid cost price');
    }
    
    const sellingPrice = parseFloat(product.selling_price);
    if (isNaN(sellingPrice) || sellingPrice < 0) {
      errors.push('Invalid selling price');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      formatted: {
        name: name?.toLowerCase() || '',
        category: (product.category?.toString().toLowerCase().trim() || 'uncategorized'),
        quantity: Math.max(0, quantity || 0),
        form: (product.form?.toString().toLowerCase().trim() || 'units'),
        cost_price: Math.max(0, costPrice || 0),
        selling_price: Math.max(0, sellingPrice || 0),
        low_stock_alert: Math.max(0, parseInt(product.low_stock_alert) || 5),
        barcode: product.barcode?.toString().trim() || '',
        shop_id: shop.id
      }
    };
  };

  const importProducts = async (productsData) => {
    const validProducts = [];
    const invalidProducts = [];
    
    productsData.forEach((product, index) => {
      const validation = validateProduct(product, index);
      
      if (validation.isValid) {
        validProducts.push(validation.formatted);
      } else {
        invalidProducts.push({
          ...product,
          errors: validation.errors,
          row: index + 2 // +2 because of header row and 0-based index
        });
      }
    });
    
    if (validProducts.length === 0) {
      throw new Error('No valid products found in the file');
    }
    
    if (invalidProducts.length > 0) {
      console.warn('Invalid products skipped:', invalidProducts);
      toast.warning(`${invalidProducts.length} products skipped due to errors`);
    }
    
    // Insert valid products in batches
    const batchSize = 10;
    for (let i = 0; i < validProducts.length; i += batchSize) {
      const batch = validProducts.slice(i, i + batchSize);
      const { error } = await supabase
        .from('products')
        .insert(batch);
      
      if (error) {
        throw new Error(`Failed to import batch: ${error.message}`);
      }
    }
    
    return { imported: validProducts.length, skipped: invalidProducts.length };
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    if (onLoadingChange) onLoadingChange(true);
    
    try {
      const products = await readCSVFile(file);
      const result = await importProducts(products);
      
      toast.success(`Successfully imported ${result.imported} products! ${result.skipped > 0 ? `${result.skipped} skipped.` : ''}`);
      
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
      if (onLoadingChange) onLoadingChange(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  return (
    <div className="csv-importer">
      <div className="import-actions">
        <label htmlFor="csv-import" className="import-btn">
          {isImporting ? '⏳ Importing...' : '📤 Import CSV'}
        </label>
        <input
          id="csv-import"
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileImport}
          disabled={isImporting}
        />
        
        <button 
          onClick={downloadTemplate} 
          className="template-btn"
          disabled={isImporting}
        >
          📋 Download Template
        </button>
      </div>
      
      <div className="import-instructions">
        <h4>Import Instructions:</h4>
        <ul>
          <li>Download the template above</li>
          <li>Fill in your product data</li>
          <li>Save as CSV file</li>
          <li>Upload using the Import button</li>
          <li>Required fields: <strong>name, category, quantity, cost_price, selling_price</strong></li>
        </ul>
      </div>
    </div>
  );
};

export default CsvImporter;