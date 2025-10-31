import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Star, 
  Check, 
  Minus, 
  ShoppingCart, 
  Heart,
  Scale,
  Eye,
  TrendingUp
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../store/store';
import { addToCart } from '../store/slices/cartSlice';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import toast from 'react-hot-toast';

interface ProductComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onRemoveProduct: (productId: string) => void;
}

const ProductComparison: React.FC<ProductComparisonProps> = ({
  isOpen,
  onClose,
  products,
  onRemoveProduct
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { wishlist } = useAppSelector(state => state.wishlist);
  const { user } = useAppSelector(state => state.auth);
  const wishlistItems = wishlist?.items || [];
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  // Demo products fallback when no products are passed
  const isDemo = products.length === 0;
  const demoProducts = [
    {
      _id: 'demo1',
      name: 'NextTech X1 Pro Smartphone',
      price: 29999,
      originalPrice: 34999,
      rating: 4.5,
      numReviews: 1243,
      stock: 25,
      images: [{ url: '/Icon.png' }],
      features: ['5G', 'AMOLED Display', 'Fast Charging', 'Dual SIM'],
      specifications: {
        Display: '6.5" AMOLED 120Hz',
        Processor: 'Snapdragon 778G',
        RAM: '8GB',
        Storage: '128GB',
        Battery: '5000mAh',
        Camera: '64MP + 12MP + 5MP',
        OS: 'Android 14',
        Weight: '180g'
      }
    },
    {
      _id: 'demo2',
      name: 'FusionBuds ANC Headphones',
      price: 7999,
      originalPrice: 9999,
      rating: 4.2,
      numReviews: 876,
      stock: 40,
      images: [{ url: '/Icon.png' }],
      features: ['Active Noise Cancellation', 'Bluetooth 5.3', 'Fast Charging'],
      specifications: {
        Driver: '40mm Dynamic',
        Battery: '35 hours',
        Weight: '220g',
        Charging: 'USB-C, 10min=5h',
        Latency: 'Low-latency mode'
      }
    },
    {
      _id: 'demo3',
      name: 'VisionMax 4K Smart TV 55"',
      price: 44999,
      originalPrice: 52999,
      rating: 4.7,
      numReviews: 432,
      stock: 10,
      images: [{ url: '/Icon.png' }],
      features: ['4K HDR', 'Dolby Vision', 'Dolby Atmos', 'Voice Assistant'],
      specifications: {
        Panel: 'VA, 60Hz',
        HDR: 'HDR10+, Dolby Vision',
        Speakers: '30W Dolby Atmos',
        OS: 'Google TV',
        Ports: '3x HDMI, 2x USB',
      }
    }
  ];
  const displayProducts = isDemo ? demoProducts : products;

  // Base comparison fields to always show
  const baseFeatures = ['Price', 'Brand', 'Rating', 'In Stock'];

  // Get all unique features from products plus base fields
  const getAllFeatures = () => {
    const allFeatures = new Set<string>(baseFeatures);
    displayProducts.forEach(product => {
      product.features?.forEach((feature: string) => allFeatures.add(feature));
      Object.keys(product.specifications || {}).forEach(spec => allFeatures.add(spec));
    });
    return Array.from(allFeatures);
  };

  const handleAddToCart = async (product: any) => {
    // Check if user is logged in using Redux state first, then localStorage as fallback
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const isAuthenticated = user || (storedUser && storedToken);
    
    if (!isAuthenticated) {
      // User not logged in - redirect to login
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }

    // User is logged in - use Redux/API cart system
    try {
      await dispatch(addToCart({
        productId: product._id,
        quantity: 1
      })).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (error: any) {
      console.error('Cart error:', error);
      toast.error('Failed to add item to cart. Please try again.');
    }
  };

  const handleToggleWishlist = (productId: string) => {
    dispatch(toggleWishlist(productId));
    const isInWishlist = wishlistItems.some(item => item.product._id === productId);
    toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.product._id === productId);
  };

  const getFeatureValue = (product: any, feature: string) => {
    // Handle base features
    switch (feature) {
      case 'Price':
        return `₹${(product.price || 0).toLocaleString()}`;
      case 'Brand':
        return product.brand || '-';
      case 'Rating':
        return typeof product.rating === 'number' ? `${product.rating}⭐` : '-';
      case 'In Stock':
        return (product.inStock ?? (product.countInStock ?? product.stock ?? 0) > 0);
      default:
        break;
    }
    // Dynamic features/specs
    if (product.features?.includes(feature)) return true;
    if (product.specifications && (feature in product.specifications)) return product.specifications[feature];
    return false;
  };

  const renderFeatureValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-500 mx-auto" />
      ) : (
        <Minus className="h-5 w-5 text-gray-400 mx-auto" />
      );
    }
    if (value === null || value === undefined || value === '') {
      return <span className="text-sm text-gray-400">-</span>;
    }
    return <span className="text-sm text-gray-700">{String(value)}</span>;
  };

  const getBestValue = () => {
    if (products.length === 0) return null;
    return products.reduce((best, current) => {
      const bestValue = best.originalPrice ? 
        ((best.originalPrice - best.price) / best.originalPrice) * 100 : 0;
      const currentValue = current.originalPrice ? 
        ((current.originalPrice - current.price) / current.originalPrice) * 100 : 0;
      return currentValue > bestValue ? current : best;
    });
  };

  const getHighestRated = () => {
    if (products.length === 0) return null;
    return products.reduce((highest, current) => 
      current.rating > highest.rating ? current : highest
    );
  };

  if (!isOpen) return null;

  const allFeatures = getAllFeatures();
  const bestValue = getBestValue();
  const highestRated = getHighestRated();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Scale className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Product Comparison</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {displayProducts.length} Products
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  try {
                    // enable multi-select mode and back up current pending list
                    localStorage.setItem('compareSelectMode', '1');
                    const existing = localStorage.getItem('comparePending');
                    localStorage.setItem('comparePendingBackup', existing ?? '[]');
                  } catch {}
                  navigate('/products?compare=1');
                  toast.success('Select products to compare, then click Done');
                }}
                className="btn-outline flex items-center space-x-2"
                aria-label="Add products to comparison"
              >
                <Scale className="h-5 w-5" />
                <span>Add products</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close comparison"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-auto max-h-[calc(90vh-100px)]">
          {displayProducts.length === 0 ? (
            <div className="text-center py-12">
              <Scale className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products to Compare</h3>
              <p className="text-gray-500">Add products to start comparing their features and specifications.</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Product Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {displayProducts.map((product) => (
                  <motion.div
                    key={product._id}
                    layout
                    className="bg-white border-2 border-gray-200 rounded-lg p-4 relative"
                  >
                    {/* Best Value Badge */}
                    {bestValue?._id === product._id && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Best Value
                      </div>
                    )}

                    {/* Highest Rated Badge */}
                    {highestRated?._id === product._id && bestValue?._id !== product._id && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        Top Rated
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => onRemoveProduct(product._id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${product.name} from comparison`}
                    >
                      <X className="h-4 w-4" />
                    </button>



                    {/* Product Info */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-sm text-gray-500">({product.numReviews})</span>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          ₹{product.price.toLocaleString()}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <>
                            <span className="text-sm text-gray-500 line-through">
                              ₹{product.originalPrice.toLocaleString()}
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span className="text-sm">Add to Cart</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleWishlist(product._id)}
                        className={`p-2 rounded-lg border transition-colors ${
                          isInWishlist(product._id)
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                        aria-label={`${isInWishlist(product._id) ? 'Remove from' : 'Add to'} wishlist`}
                      >
                        <Heart className={`h-4 w-4 ${isInWishlist(product._id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Feature Comparison Table */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Feature Comparison
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Feature</th>
                        {displayProducts.map((product) => (
                          <th key={product._id} className="text-center py-3 px-4 font-medium text-gray-900 min-w-[150px]">
                            {product.name.length > 20 ? `${product.name.substring(0, 20)}...` : product.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allFeatures.map((feature, index) => (
                        <motion.tr
                          key={feature}
                          className={`border-b border-gray-100 hover:bg-white transition-colors cursor-pointer ${
                            selectedFeature === feature ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedFeature(selectedFeature === feature ? null : feature)}
                          whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                        >
                          <td className="py-3 px-4 font-medium text-gray-700">
                            {feature}
                          </td>
                          {displayProducts.map((product) => (
                            <td key={`${product._id}-${feature}`} className="py-3 px-4 text-center">
                              {renderFeatureValue(getFeatureValue(product, feature))}
                            </td>
                          ))}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProductComparison;