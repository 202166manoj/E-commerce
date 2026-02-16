const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  images: [{
    type: String,
    required: true
  }],
  category: {
    type: String,
    default: 'T-Shirt'
  },
  variants: [{
    color: {
      type: String,
      required: true
    },
    colorCode: {
      type: String,
      default: '#000000'
    },
    sizes: [{
      size: {
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
        required: true
      },
      stock: {
        type: Number,
        required: true,
        min: [0, 'Stock cannot be negative'],
        default: 0
      }
    }]
  }],
  featured: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check stock availability
productSchema.methods.checkStock = function(color, size, quantity) {
  const variant = this.variants.find(v => v.color === color);
  if (!variant) return false;
  
  const sizeObj = variant.sizes.find(s => s.size === size);
  if (!sizeObj) return false;
  
  return sizeObj.stock >= quantity;
};

// Method to reduce stock
productSchema.methods.reduceStock = function(color, size, quantity) {
  const variant = this.variants.find(v => v.color === color);
  if (variant) {
    const sizeObj = variant.sizes.find(s => s.size === size);
    if (sizeObj && sizeObj.stock >= quantity) {
      sizeObj.stock -= quantity;
      return true;
    }
  }
  return false;
};

module.exports = mongoose.model('Product', productSchema);