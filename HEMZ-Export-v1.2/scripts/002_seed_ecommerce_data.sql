-- Seed data for HEMZ Pashmina e-commerce
-- Migration 002: Insert sample products and configuration

-- Insert products (converting from existing JSON structure)
INSERT INTO products (title, slug, description, base_price_cents, currency, weight_grams, material, care_instructions, moq, lead_time_days) VALUES
('Kashmiri Cashmere Shawl - Ivory', 'kashmiri-cashmere-shawl-ivory', 'Hand-woven Kashmiri cashmere shawl with fine pashmina weave. Lightweight yet warm, perfect for export.', 9500, 'USD', 200, '100% Pure Cashmere', 'Dry clean only. Store in breathable bag.', 50, 21),
('Premium Pashmina Scarf - Burgundy', 'premium-pashmina-scarf-burgundy', 'Ultra-soft pashmina scarf with traditional Kashmiri craftsmanship. Elegant drape and luxurious feel.', 7500, 'USD', 150, '100% Pure Pashmina', 'Hand wash in cold water. Lay flat to dry.', 25, 14),
('Embroidered Cashmere Wrap - Navy', 'embroidered-cashmere-wrap-navy', 'Exquisite hand-embroidered cashmere wrap featuring traditional Kashmiri motifs in gold thread.', 12500, 'USD', 300, '100% Cashmere with Silk Embroidery', 'Professional dry clean only. Handle with care.', 20, 28),
('Lightweight Pashmina Stole - Rose Gold', 'lightweight-pashmina-stole-rose-gold', 'Delicate pashmina stole perfect for evening wear. Subtle shimmer and elegant drape.', 6500, 'USD', 120, '70% Pashmina, 30% Silk', 'Gentle hand wash. Air dry away from direct sunlight.', 30, 18);

-- Insert product variants
INSERT INTO product_variants (product_id, sku, attributes_json, stock_quantity) VALUES
(1, 'CSH-001-IV-70x200', '{"color": "Ivory", "size": "70x200cm"}', 150),
(1, 'CSH-001-IV-90x200', '{"color": "Ivory", "size": "90x200cm"}', 100),
(2, 'PSC-002-BU-60x180', '{"color": "Burgundy", "size": "60x180cm"}', 200),
(2, 'PSC-002-BU-70x200', '{"color": "Burgundy", "size": "70x200cm"}', 120),
(3, 'ECW-003-NV-80x200', '{"color": "Navy", "size": "80x200cm"}', 75),
(3, 'ECW-003-NV-90x220', '{"color": "Navy", "size": "90x220cm"}', 50),
(4, 'LPS-004-RG-60x180', '{"color": "Rose Gold", "size": "60x180cm"}', 180),
(4, 'LPS-004-RG-70x200', '{"color": "Rose Gold", "size": "70x200cm"}', 140);

-- Insert product images
INSERT INTO product_images (product_id, variant_id, url, alt_text, sort_order) VALUES
(1, 1, '/assets/products/csh-001/flatlay.jpg', 'Kashmiri Cashmere Shawl Ivory - Flat lay view', 1),
(1, 1, '/assets/products/csh-001/model.jpg', 'Kashmiri Cashmere Shawl Ivory - Model wearing', 2),
(1, 1, '/assets/products/csh-001/closeup.jpg', 'Kashmiri Cashmere Shawl Ivory - Close-up texture', 3),
(1, 1, '/assets/products/csh-001/styled.jpg', 'Kashmiri Cashmere Shawl Ivory - Styled scene', 4),
(2, 3, '/assets/products/psc-002/flatlay.jpg', 'Premium Pashmina Scarf Burgundy - Flat lay view', 1),
(2, 3, '/assets/products/psc-002/model.jpg', 'Premium Pashmina Scarf Burgundy - Model wearing', 2),
(2, 3, '/assets/products/psc-002/closeup.jpg', 'Premium Pashmina Scarf Burgundy - Close-up texture', 3),
(2, 3, '/assets/products/psc-002/styled.jpg', 'Premium Pashmina Scarf Burgundy - Styled scene', 4);

-- Insert shipping rates
INSERT INTO shipping_rates (name, description, rate_type, base_rate_cents, per_kg_cents, free_shipping_threshold_cents, countries_json) VALUES
('Standard International', 'Standard shipping worldwide (7-14 business days)', 'weight_based', 1500, 800, 15000, '[]'),
('Express International', 'Express shipping worldwide (3-7 business days)', 'weight_based', 3500, 1200, 25000, '[]'),
('Premium White Glove', 'Premium delivery with tracking and insurance', 'weight_based', 7500, 2000, 50000, '[]'),
('Domestic India', 'Shipping within India', 'weight_based', 500, 300, 10000, '["IN"]'),
('Free Shipping Promotion', 'Free shipping for large orders', 'free', 0, 0, 20000, '[]');

-- Insert tax rates
INSERT INTO tax_rates (name, rate_percentage, country_code, state_code, tax_type) VALUES
('India GST', 0.1800, 'IN', NULL, 'GST'),
('US Sales Tax', 0.0875, 'US', 'NY', 'Sales Tax'),
('UK VAT', 0.2000, 'GB', NULL, 'VAT'),
('EU VAT Standard', 0.2100, 'DE', NULL, 'VAT'),
('Canada GST', 0.0500, 'CA', NULL, 'GST');

-- Insert sample coupons
INSERT INTO coupons (code, discount_type, value_cents, minimum_order_cents, usage_limit, expires_at) VALUES
('WELCOME10', 'percent', 1000, 5000, 100, '2025-12-31 23:59:59'), -- 10% off
('BULK50', 'amount', 5000, 20000, NULL, '2025-06-30 23:59:59'), -- $50 off orders over $200
('FIRSTORDER', 'percent', 1500, 10000, 1, '2025-12-31 23:59:59'), -- 15% off first order
('EXPORT25', 'amount', 2500, 15000, 50, '2025-09-30 23:59:59'); -- $25 off export orders
