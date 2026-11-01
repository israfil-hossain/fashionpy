/**
 * Fixture mirrors the real markup of a dropshipping.com.bd product page:
 * OG product meta + Blade-rendered h2, gallery, size modal, description tab,
 * breadcrumb and delivery table (logged-out view hides visible prices).
 */
export const DROPSHIPPING_PRODUCT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Premium Stainless Steel Bar Pendant Chain || 13321</title>
  <meta property="og:type" content="product">
  <meta property="og:title" content="Premium Stainless Steel Bar Pendant Chain">
  <meta property="og:description" content="n/a">
  <meta property="og:image" content="https://dropshipping.com.bd/public//storage/images/products/img_6ad9927ad5472_0_1792643706.jpg">
  <meta property="product:brand" content="dropshipping.com.bd">
  <meta property="product:availability" content="in stock">
  <meta property="product:price:amount" content="150">
  <meta property="product:price:currency" content="BDT">
</head>
<body>
  <div class="single_product_area">
    <div class="single_product_list">
      <ul>
        <li><a href="https://dropshipping.com.bd" class="single_product_list_link">Home</a></li>
        <li><a href="https://dropshipping.com.bd/mens-fashion" class="single_product_list_link">Men's Fashion</a></li>
        <li><a href="https://dropshipping.com.bd/mens-fashion/mens-accessories" class="single_product_list_link">Men's Accessories</a></li>
      </ul>
    </div>
    <div class="zooming_image_content">
      <div class="zoom_img_active owl-carousel">
        <div id="main_image_651315" class="zooming_show_image">
          <img src="https://dropshipping.com.bd/public//storage/images/products/img_6ad9927ad5472_0_1792643706.jpg" alt="">
        </div>
      </div>
    </div>
    <div class="single_product_name">
      <input type="hidden" id="single_page_product_id" value="27113">
      <h2>Premium Stainless Steel Bar Pendant Chain</h2>
    </div>
    <div class="single_product_attribute s_p_code">
      <strong>Code:</strong>
      <span>13321</span>
    </div>
  </div>

  <div class="single_product_tab_area">
    <div id="home" class="tab-pane">
      <div class="single_product_tab_content">
        <p><strong>Premium Stainless Steel Bar Pendant Chain</strong></p>
        <p><strong>ম্যাটেরিয়াল:</strong> হাই কোয়ালিটি স্টেইনলেস স্টিল</p>
        <p><strong>ডিজাইন:</strong> গর্জিয়াস স্টোন সহ ব্ল্যাক বার প্যান্ডেন্ট</p>
      </div>
    </div>
  </div>

  <div class="product_select_attribute_container_modal">
    <p>Select Size</p>
    <div class="product_select_attribute_modal">
      <ul>
        <li>
          <div class="select_size_name_modal"><span>XL</span></div>
          <div class="select_price_btn_modal">
            <span class="select_price_modal">500TK</span>
            <span class="select_price_modal">300TK</span>
          </div>
        </li>
        <li>
          <div class="select_size_name_modal"><span>L</span></div>
          <div class="select_price_btn_modal">
            <span class="select_price_modal">500TK</span>
            <span class="select_price_modal">280TK</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</body>
</html>`

export const SHOPIFY_STYLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Classic Tee – Myshop</title>
  <meta property="og:title" content="Classic Tee">
  <meta property="og:image" content="https://cdn.example.com/tee.jpg">
  <meta property="product:price:amount" content="29.99">
  <meta property="product:price:currency" content="USD">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Classic Tee",
    "image": ["https://cdn.example.com/tee.jpg", "https://cdn.example.com/tee-2.jpg"],
    "description": "A soft cotton tee.",
    "brand": { "@type": "Brand", "name": "Myshop" },
    "sku": "TEE-001",
    "offers": {
      "@type": "Offer",
      "price": "29.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>
</head>
<body>
  <h1 class="product-title">Classic Tee</h1>
  <div class="product-gallery">
    <img src="https://cdn.example.com/tee.jpg" alt="">
    <img src="https://cdn.example.com/tee-2.jpg" alt="">
  </div>
  <div id="tab-description">A soft cotton tee.</div>
</body>
</html>`

export const BARE_PAGE_HTML = `<!DOCTYPE html>
<html><head><title>Nothing here</title></head><body><p>hello</p></body></html>`
