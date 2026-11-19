/**
 * Canonical storefront policy content — the 9 slugs the footer links to.
 *
 * Sourced from the platform's actual rules: 30-day return/exchange/claim
 * window (`RETURN_POLICY_DAYS`), COD + Stripe card payments, Pathao &
 * Steadfast courier partners, the seeded ৳6,500 free-delivery offer, the
 * 10% default commission, and bank/bKash/Nagad seller payouts.
 *
 * Bilingual (English + বাংলা) in a single HTML body — the storefront renders
 * one `content` field per policy. Only tags the storefront sanitizer allows
 * (p, h2, h3, strong, em, u, s, ul, ol, li, blockquote, a) are used.
 * Seeded as published placeholders by `seed.ts`; re-seeds refresh only rows
 * whose content is still the placeholder, so admin edits always win.
 */

export type PolicyPageContent = {
  slug: string
  title: string
  excerpt: string
  content: string
}

const UPDATED = "১৯ নভেম্বর ২০২৬ / 19 November 2026"

export const POLICY_PAGES: PolicyPageContent[] = [
  {
    slug: "return-refund",
    title: "Return & Refund Policy",
    excerpt:
      "Return items within 30 days of delivery for a refund — conditions, process and timelines.",
    content: `
<p><em>Last updated: ${UPDATED}</em></p>

<h2>English</h2>
<p>You may return most items within <strong>30 days of delivery</strong> for a full refund. This applies across every seller on FashionPy.</p>
<h3>Return conditions</h3>
<ul>
  <li>The item is unused, unworn and in its original condition with tags and packaging intact.</li>
  <li>You have your order reference (visible in Your Orders).</li>
  <li>Hygiene-sensitive items (underwear, innerwear, stockings) and items marked “final sale” cannot be returned unless they are defective or wrong.</li>
</ul>
<h3>How to request a return</h3>
<ol>
  <li>Open <strong>Your Orders → the order → Return</strong> and pick a reason.</li>
  <li>We arrange a pickup through our courier partner (Pathao or Steadfast).</li>
  <li>Once the item reaches the seller and passes inspection, your refund is issued.</li>
</ol>
<h3>Refunds</h3>
<ul>
  <li><strong>Card payments:</strong> refunded to the original card — typically 5–10 business days after the return is approved, depending on your bank.</li>
  <li><strong>Cash on Delivery:</strong> we confirm your details and transfer the refund to your bank account or mobile financial service.</li>
  <li>Original delivery charges are not refunded for change-of-mind returns; if the item was defective or we sent the wrong item, return shipping is on us.</li>
</ul>
<p>Your rights under the <strong>Consumer Rights Protection Act, 2009</strong> are not affected by this policy. Defective products are always eligible for repair, replacement or refund.</p>

<h2>বাংলা</h2>
<p>ডেলিভারির <strong>৩০ দিনের মধ্যে</strong> অধিকাংশ পণ্য ফেরত দিয়ে সম্পূর্ণ রিফান্ড নেওয়া যায়। FashionPy-এর সকল সেলারের ক্ষেত্রে এটি প্রযোজ্য।</p>
<h3>ফেরতের শর্ত</h3>
<ul>
  <li>পণ্যটি ব্যবহার না করা, ট্যাগ ও প্যাকেজিং অক্ষত থাকতে হবে।</li>
  <li>অর্ডার রেফারেন্স (Your Orders-এ পাওয়া যায়) থাকতে হবে।</li>
  <li>হাইজিন-সংবেদনশীল পণ্য (আন্ডারওয়্যার ইত্যাদি) এবং “final sale” চিহ্নিত পণ্য ত্রুটিপূর্ণ বা ভুল পণ্য না হলে ফেরতযোগ্য নয়।</li>
</ul>
<h3>ফেরতের নিয়ম</h3>
<ol>
  <li><strong>Your Orders → অর্ডার → Return</strong> এ গিয়ে কারণ নির্বাচন করুন।</li>
  <li>আমাদের কুরিয়ার অংশীদার (Pathao বা Steadfast) এর মাধ্যমে পিকআপ সেট হবে।</li>
  <li>পণ্য সেলারের কাছে পৌঁছে পরীক্ষার পর রিফান্ড জারি হবে।</li>
</ol>
<h3>রিফান্ড</h3>
<ul>
  <li><strong>কার্ড পেমেন্ট:</strong> মূল কার্ডে ফেরত — অনুমোদনের পর সাধারণত ৫–১০ কর্মদিবসের মধ্যে (ব্যাংকভেদে পার্থক্য হতে পারে)।</li>
  <li><strong>ক্যাশ অন ডেলিভারি:</strong> তথ্য যাচাইয়ের পর ব্যাংক অ্যাকাউন্ট বা মোবাইল আর্থিক সেবায় রিফান্ড ছাড়া হবে।</li>
  <li>খুচরা ইচ্ছায় ফেরতে আসল ডেলিভারি চার্জ ফেরত হয় না; পণ্য ত্রুটিপূর্ণ বা ভুল পণ্য পাঠালে রিটার্ন খরচ আমরাই বহন করি।</li>
</ul>
<p><strong>Consumer Rights Protection Act, 2009</strong>-এর অধীনে আপনার অধিকার অক্ষত থাকবে। ত্রুটিপূর্ণ পণ্য সবসময় মেরামত, বদল বা রিফান্ডের যোগ্য।</p>
`.trim(),
  },
  {
    slug: "exchange",
    title: "Exchange Policy",
    excerpt:
      "Exchange size or colour within 30 days of delivery, subject to stock availability.",
    content: `
<p><em>Last updated: ${UPDATED}</em></p>

<h2>English</h2>
<p>Ordered the wrong size or colour? You can exchange an item within <strong>30 days of delivery</strong>, subject to stock availability.</p>
<h3>What can be exchanged</h3>
<ul>
  <li>The same product in a different size or colour.</li>
  <li>The item must be unused, unworn and in original condition with tags — the same standard as our return policy.</li>
  <li>Underwear, innerwear and items marked “final sale” can only be exchanged if defective or wrong.</li>
</ul>
<h3>How it works</h3>
<ol>
  <li>Open <strong>Your Orders → the order → Return/Exchange</strong> and choose “Exchange”.</li>
  <li>Pick the size or colour you want. If it is in stock, it is reserved for you.</li>
  <li>We arrange a pickup of the original item; the replacement ships once the pickup is confirmed.</li>
  <li>If the replacement costs more, you pay the difference at checkout for the new item; if it costs less, we refund the difference.</li>
</ol>
<p><strong>If the replacement is out of stock,</strong> you can switch to a full refund instead — the standard 30-day return process applies.</p>

<h2>বাংলা</h2>
<p>সাইজ বা রঙ ভুল হয়ে গেছে? স্টক থাকলে ডেলিভারির <strong>৩০ দিনের মধ্যে</strong> পণ্য বদল করা যায়।</p>
<h3>যা বদল করা যায়</h3>
<ul>
  <li>একই পণ্যের অন্য সাইজ বা রঙ।</li>
  <li>পণ্যটি অব্যবহার করা, ট্যাগসহ আসল অবস্থায় থাকতে হবে — রিটার্ন নীতির একই শর্ত প্রযোজ্য।</li>
  <li>আন্ডারওয়্যার ও “final sale” চিহ্নিত পণ্য শুধু ত্রুটিপূর্ণ বা ভুল হলে বদলযোগ্য।</li>
</ul>
<h3>কীভাবে কাজ করে</h3>
<ol>
  <li><strong>Your Orders → অর্ডার → Return/Exchange</strong> এ গিয়ে “Exchange” নির্বাচন করুন।</li>
  <li>প্রয়োজনীয় সাইজ বা রঙ বেছে নিন; স্টক থাকলে সেটি আপনার জন্য সংরক্ষিত হবে।</li>
  <li>আসল পণ্যটি পিকআপ হবে; পিকআপ নিশ্চিত হলে বদলের পণ্য পাঠানো হবে।</li>
  <li>বদলের পণ্যের দাম বেশি হলে পার্থক্য পরিশোধ করতে হবে; কম হলে পার্থক্য রিফান্ড হবে।</li>
</ol>
<p><strong>বদলের পণ্য স্টকে না থাকলে</strong> আপনি সম্পূর্ণ রিফান্ড বেছে নিতে পারেন — প্রচলিত ৩০ দিনের রিটার্ন প্রক্রিয়া প্রযোজ্য।</p>
`.trim(),
  },
  {
    slug: "shipping",
    title: "Shipping & Delivery Policy",
    excerpt:
      "Dispatch times, delivery estimates across Bangladesh, charges and tracking.",
    content: `
<p><em>Last updated: ${UPDATED}</em></p>

<h2>English</h2>
<p>FashionPy delivers across Bangladesh through our courier partners <strong>Pathao</strong> and <strong>Steadfast</strong>.</p>
<h3>Dispatch</h3>
<ul>
  <li>Sellers usually dispatch orders within <strong>1–3 business days</strong> of confirmation.</li>
  <li>Orders placed on Friday evenings or public holidays start processing the next working day.</li>
  <li>An order with items from multiple sellers may arrive as separate parcels.</li>
</ul>
<h3>Delivery estimates</h3>
<ul>
  <li><strong>Dhaka metro:</strong> typically 1–2 business days after dispatch.</li>
  <li><strong>Outside Dhaka:</strong> typically 2–5 business days after dispatch.</li>
  <li>Remote areas and peak seasons (Eid, sales events) may take longer. Estimates are not guarantees — track your shipment for live status.</li>
</ul>
<h3>Charges</h3>
<ul>
  <li>Delivery charges (if any) are shown at checkout before you pay.</li>
  <li>Free-delivery offers — for example on orders over <strong>৳6,500</strong> — apply when the offer is running and are shown at checkout.</li>
</ul>
<h3>Tracking & handover</h3>
<ul>
  <li>Shipment updates appear in <strong>Your Orders</strong> and are sent by SMS/notifications.</li>
  <li>Please check the parcel (right item, correct size, intact packaging) before accepting it — especially for Cash on Delivery.</li>
</ul>

<h2>বাংলা</h2>
<p>FashionPy আমাদের কুরিয়ার অংশীদার <strong>Pathao</strong> ও <strong>Steadfast</strong>-এর মাধ্যমে সারা বাংলাদেশে ডেলিভারি করে।</p>
<h3>ডিসপ্যাচ</h3>
<ul>
  <li>সেলাররা সাধারণত অর্ডার নিশ্চিত হওয়ার <strong>১–৩ কর্মদিবসের</strong> মধ্যে পাঠিয়ে দেন।</li>
  <li>শুক্রবার সন্ধ্যা বা ছুটির দিনে দেওয়া অর্ডার পরবর্তী কর্মদিবসে শুরু হয়।</li>
  <li>একাধিক সেলারের পণ্য থাকলে অর্ডার আলাদা পার্সেলে আসতে পারে।</li>
</ul>
<h3>ডেলিভারি সময়</h3>
<ul>
  <li><strong>ঢাকা মেট্রো:</strong> ডিসপ্যাচের পর সাধারণত ১–২ কর্মদিবস।</li>
  <li><strong>ঢাকার বাইরে:</strong> ডিসপ্যাচের পর সাধারণত ২–৫ কর্মদিবস।</li>
  <li>দূরবর্তী এলাকা ও চাপা সময়ে (ঈদ, সেল) সময় বেশি লাগতে পারে। এটি আনুমানিক সময়, নিশ্চয়তা নয় — লাইভ অবস্থা জানতে অর্ডার ট্র্যাক করুন।</li>
</ul>
<h3>চার্জ</h3>
<ul>
  <li>ডেলিভারি চার্জ (থাকলে) পেমেন্টের আগেই চেকআউটে দেখানো হয়।</li>
  <li>ফ্রি ডেলিভারি অফার — যেমন <strong>৳৬,৫০০</strong> টাকার বেশি অর্ডারে — চালু থাকলে চেকআউটে প্রযোজ্য হয়।</li>
</ul>
<h3>ট্র্যাকিং ও হস্তান্তর</h3>
<ul>
  <li>শিপমেন্ট আপডেট <strong>Your Orders</strong>-এ পাওয়া যায় এবং SMS/নোটিফিকেশনে আসে।</li>
  <li>পার্সেল নেওয়ার আগে যাচাই করুন (সঠিক পণ্য, সঠিক সাইজ, অক্ষত প্যাকেজিং) — বিশেষত ক্যাশ অন ডেলিভারিতে।</li>
</ul>
`.trim(),
  },
  {
    slug: "cancellation",
    title: "Cancellation Policy",
    excerpt:
      "Cancel orders before dispatch at no charge; how seller cancellations and refunds work.",
    content: `
<p><em>Last updated: ${UPDATED}</em></p>

<h2>English</h2>
<h3>Cancelling your order</h3>
<ul>
  <li>You can cancel an order <strong>any time before it is dispatched</strong>, free of charge, from <strong>Your Orders → Cancel</strong>.</li>
  <li>Once a parcel has been dispatched, the order can no longer be cancelled — you can instead refuse the parcel at handover or use our 30-day return process after delivery.</li>
  <li><strong>Cash on Delivery orders</strong> can be cancelled before dispatch with no payment involved.</li>
</ul>
<h3>Refunds on cancelled orders</h3>
<ul>
  <li><strong>Prepaid (card):</strong> the full amount — including delivery charges — is refunded to the original card, typically within 5–10 business days.</li>
  <li>No cancellation fee is charged at any stage.</li>
</ul>
<h3>When we or the seller cancel</h3>
<ul>
  <li>A seller may cancel if the item is out of stock, cannot be shipped to your area, or a pricing error occurred. You are notified immediately and refunded in full.</li>
  <li>FashionPy may cancel orders that fail fraud, payment or address checks — with no charge to you.</li>
  <li>Repeated no-show cancellations (ordering and refusing parcels) may lead to account restrictions, since refused COD parcels carry real courier costs.</li>
</ul>

<h2>বাংলা</h2>
<h3>অর্ডার বাতিল</h3>
<ul>
  <li><strong>ডিসপ্যাচের আগে</strong> যেকোনো সময় <strong>Your Orders → Cancel</strong> থেকে বিনামূল্যে অর্ডার বাতিল করা যায়।</li>
  <li>পার্সেল ডিসপ্যাচ হওয়ার পর অর্ডার বাতিল করা যায় না — হস্তান্তরের সময় পার্সেল ফিরিয়ে দিতে পারেন, অথবা ডেলিভারির পর ৩০ দিনের রিটার্ন প্রক্রিয়া ব্যবহার করুন।</li>
  <li><strong>ক্যাশ অন ডেলিভারি</strong> অর্ডার ডিসপ্যাচের আগে কোনো পেমেন্ট ছাড়াই বাতিল করা যায়।</li>
</ul>
<h3>বাতিল অর্ডারের রিফান্ড</h3>
<ul>
  <li><strong>অগ্রিম পেমেন্ট (কার্ড):</strong> ডেলিভারি চাসহ সম্পূর্ণ টাকা মূল কার্ডে ফেরত — সাধারণত ৫–১০ কর্মদিবসের মধ্যে।</li>
  <li>কোনো ধাপে বাতিলকরণ ফি নেওয়া হয় না।</li>
</ul>
<h3>আমাদের বা সেলারের পক্ষে বাতিল</h3>
<ul>
  <li>স্টক না থাকলে, আপনার এলাকায় পাঠানো না গেলে বা মূল্যে ত্রুটি থাকলে সেলার অর্ডার বাতিল করতে পারেন। অবিলম্বে জানানো হয় এবং সম্পূর্ণ রিফান্ড দেওয়া হয়।</li>
  <li>জালিয়াতি, পেমেন্ট বা ঠিকানা যাচাই ব্যর্থ হলে FashionPy অর্ডার বাতিল করতে পারে — কোনো খরচ ছাড়াই।</li>
  <li>বারবার অর্ডার করে পার্সেল ফিরিয়ে দিলে অ্যাকাউন্টে বিধিনিষেধ আসতে পারে, কারণ ফিরত COD পার্সেলে আসল কুরিয়ার খরচ হয়।</li>
</ul>
`.trim(),
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    excerpt:
      "What we collect, why we use it, who we share it with, and your choices.",
    content: `
<p><em>Last updated: ${UPDATED}</em></p>

<h2>English</h2>
<p>This policy explains how FashionPy handles your personal information when you shop with us.</p>
<h3>What we collect</h3>
<ul>
  <li><strong>Account & order information:</strong> name, phone number, email, delivery addresses and your order history.</li>
  <li><strong>Payment information:</strong> card payments are processed by <strong>Stripe</strong>; FashionPy never stores your full card number. Cash on Delivery orders need no payment data.</li>
  <li><strong>Browser data:</strong> we use cookies and local storage to keep you signed in, hold your cart and remember preferences (including a guest identifier for cart-to-order transfer).</li>
  <li><strong>Usage data:</strong> pages viewed, device and approximate location (country/region) to improve the store and prevent fraud.</li>
</ul>
<h3>How we use it</h3>
<ul>
  <li>To process, deliver and support your orders; to communicate order and delivery updates.</li>
  <li>To prevent fraud and keep the marketplace secure.</li>
  <li>To improve products, search and the shopping experience — in aggregated form wherever possible.</li>
</ul>
<h3>Who we share it with</h3>
<ul>
  <li><strong>Sellers:</strong> only what they need to fulfil your order (name, phone, address, items).</li>
  <li><strong>Courier partners (Pathao, Steadfast):</strong> name, phone and address to deliver.</li>
  <li><strong>Payment processor (Stripe)</strong> and regulators where the law requires.</li>
</ul>
<p><strong>We never sell your personal data.</strong> You may access, correct or delete your data — and withdraw marketing consent — by contacting support from your account. We keep information while your account is active and as long as required for legal and tax purposes. This policy may be updated; the “last updated” date shows the current version.</p>

<h2>বাংলা</h2>
<p>কেনা-কাটার সময় আপনার ব্যক্তিগত তথ্য কীভাবে সামলানো হয়, তা এই নীতিতে ব্যাখ্যা করা হয়েছে।</p>
<h3>আমরা যা সংগ্রহ করি</h3>
<ul>
  <li><strong>অ্যাকাউন্ট ও অর্ডার:</strong> নাম, ফোন নম্বর, ইমেইল, ডেলিভারি ঠিকানা এবং অর্ডারের ইতিহাস।</li>
  <li><strong>পেমেন্ট তথ্য:</strong> কার্ড পেমেন্ট <strong>Stripe</strong>-এর মাধ্যমে প্রক্রিয়া হয়; FashionPy কখনোই আপনার সম্পূর্ণ কার্ড নম্বর সংরক্ষণ করে না। ক্যাশ অন ডেলিভারিতে কোনো পেমেন্ট তথ্য লাগে না।</li>
  <li><strong>ব্রাউজার তথ্য:</strong> সাইন-ইন রাখতে, কার্ট সংরক্ষণ ও পছন্দ মনে রাখতে কুকি ও লোকাল স্টোরেজ ব্যবহার করি (কার্ট-টু-অর্ডার হস্তান্তরের জন্য একটি গেস্ট আইডেন্টিফায়ারসহ)।</li>
  <li><strong>ব্যবহারের তথ্য:</strong> কোন পাতা দেখেছেন, ডিভাইস ও আনুমানিক অবস্থান (দেশ/অঞ্চল) — দোকান উন্নত ও জালিয়াতি রোধে।</li>
</ul>
<h3>ব্যবহার</h3>
<ul>
  <li>অর্ডার প্রক্রিয়া, ডেলিভারি ও সহায়তা; অর্ডার/ডেলিভারি আপডেট জানানো।</li>
  <li>জালিয়াতি রোধ ও মার্কেটপ্লেস নিরাপত্তা রক্ষা।</li>
  <li>পণ্য, সার্চ ও কেনাকাটার অভিজ্ঞতা উন্নত করা — সম্ভব হলে সমষ্টিগত রূপে।</li>
</ul>
<h3>কার সাথে শেয়ার</h3>
<ul>
  <li><strong>সেলার:</strong> অর্ডার পূরণে যা দরকার তা-ই (নাম, ফোন, ঠিকানা, পণ্য)।</li>
  <li><strong>কুরিয়ার অংশীদার (Pathao, Steadfast):</strong> ডেলিভারির জন্য নাম, ফোন ও ঠিকানা।</li>
  <li><strong>পেমেন্ট প্রসেসর (Stripe)</strong> এবং আইন অনুযায়ী প্রয়োজনীয় কর্তৃপক্ষ।</li>
</ul>
<p><strong>আমরা আপনার ব্যক্তিগত তথ্য কখনো বিক্রি করি না।</strong> অ্যাকাউন্ট থেকে সাপোর্টে যোগাযোগ করে আপনার তথ্য দেখা, সংশোধন বা মুছে ফেলা এবং মার্কেটিং সম্মতি প্রত্যাহার করা যায়। অ্যাকাউন্ট সক্রিয় থাকা পর্যন্ত ও আইন/কর অনুযায়ী প্রয়োজনীয় সময় পর্যন্ত তথ্য রাখা হয়। নীতি আপডেট হতে পারে; “last updated” তারিখ বর্তমান সংস্করণ দেখায়।</p>
`.trim(),
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    excerpt:
      "The rules for using FashionPy — accounts, orders, payments, liability and governing law.",
    content: `
<p><em>Last updated: ${UPDATED}</em></p>

<h2>English</h2>
<p>By using FashionPy you agree to these terms. If you do not agree, please do not use the platform.</p>
<h3>1. Our role</h3>
<p>FashionPy is a <strong>marketplace platform</strong> connecting independent sellers with buyers in Bangladesh. The contract of sale for any product is between <strong>you and the seller</strong>; FashionPy provides the platform, payments infrastructure, delivery coordination and support.</p>
<h3>2. Accounts</h3>
<ul>
  <li>Provide accurate information and keep your login secure — you are responsible for activity under your account.</li>
  <li>One person may not maintain multiple accounts to manipulate ratings, offers or coupons.</li>
</ul>
<h3>3. Orders, pricing & payment</h3>
<ul>
  <li>Prices are in <strong>BDT (৳)</strong> and include applicable taxes unless stated otherwise. Obvious pricing errors may be cancelled with a full refund.</li>
  <li>Payment by <strong>Cash on Delivery</strong> or <strong>card (Stripe)</strong>. Placing an order is an offer to buy; the sale is confirmed when the seller accepts and dispatches it.</li>
</ul>
<h3>4. Delivery, returns & cancellation</h3>
<p>Governed by our Shipping, Return, Exchange and Cancellation policies, which form part of these terms.</p>
<h3>5. Acceptable use</h3>
<ul>
  <li>No fraud, fake orders, review manipulation, harassment, or listing of prohibited products (see Product Policy).</li>
  <li>No infringement of intellectual property — your listings and content must be yours or authorised.</li>
</ul>
<h3>6. Sellers</h3>
<p>Selling on FashionPy is subject to the <strong>Seller Policy</strong>, including listing duties, commission, fulfilment and payout rules.</p>
<h3>7. Intellectual property</h3>
<p>The FashionPy name, logo, platform software and site content belong to FashionPy or its licensors and may not be used without permission.</p>
<h3>8. Liability</h3>
<p>To the extent permitted by Bangladeshi law: the platform is provided “as is”; we are not liable for indirect or consequential losses; our total liability for any claim is limited to the amount paid for the order in question. Nothing in these terms limits rights you have as a consumer under the Consumer Rights Protection Act, 2009.</p>
<h3>9. Governing law</h3>
<p>These terms are governed by the laws of Bangladesh, and the courts of Dhaka have exclusive jurisdiction.</p>
<h3>10. Changes</h3>
<p>We may update these terms; the “last updated” date reflects the current version. Continued use after changes means acceptance.</p>

<h2>বাংলা</h2>
<p>FashionPy ব্যবহার করলে আপনি এই শর্তাবলিতে সম্মত হন। সম্মত না হলে প্ল্যাটফর্ম ব্যবহার করবেন না।</p>
<h3>১. আমাদের ভূমিকা</h3>
<p>FashionPy একটি <strong>মার্কেটপ্লেস প্ল্যাটফর্ম</strong> — স্বাধীন সেলার ও ক্রেতাদের সংযোগকারী। যেকোনো পণ্যের ক্রয়-বিক্রয়ের চুক্তি <strong>আপনার ও সেলারের</strong> মধ্যে; FashionPy প্ল্যাটফর্ম, পেমেন্ট, ডেলিভারি সমন্বয় ও সহায়তা প্রদান করে।</p>
<h3>২. অ্যাকাউন্ট</h3>
<ul>
  <li>সঠিক তথ্য দিন ও লগইন নিরাপদ রাখুন — আপনার অ্যাকাউন্টের কার্যক্রমের দায়িত্ব আপনার।</li>
  <li>রেটিং, অফার বা কুপন নিয়ন্ত্রণে একাধিক অ্যাকাউন্ট খোলা যাবে না।</li>
</ul>
<h3>৩. অর্ডার, দাম ও পেমেন্ট</h3>
<ul>
  <li>দাম <strong>বাংলাদেশি টাকায় (৳)</strong> এবং প্রযোজ্য কর অন্তর্ভুক্ত (অন্যথা না বলা পর্যন্ত)। স্পষ্ট মূল্য ত্রুটি বাতিল হতে পারে — সম্পূর্ণ রিফান্ডসহ।</li>
  <li>পেমেন্ট <strong>ক্যাশ অন ডেলিভারি</strong> বা <strong>কার্ড (Stripe)</strong>-এ। অর্ডার করা কেনার প্রস্তাব; সেলার গ্রহণ ও ডিসপ্যাচ করলে বিক্রয় চূড়ান্ত হয়।</li>
</ul>
<h3>৪. ডেলিভারি, রিটার্ন ও বাতিল</h3>
<p>আমাদের Shipping, Return, Exchange ও Cancellation নীতি প্রযোজ্য — এগুলো এই শর্তাবলির অংশ।</p>
<h3>৫. সদ্ব্যবহার</h3>
<ul>
  <li>জালিয়াতি, নকল অর্ডার, রিভিউ কারচুপি, হয়রানি বা নিষিদ্ধ পণ্য তালিকাভুক্ত করা যাবে না (Product Policy দেখুন)।</li>
  <li>বৌদ্ধিক সম্পদ লঙ্ঘন নয় — আপনার তালিকা ও কনটেন্ট আপনার নিজের বা অনুমোদিত হতে হবে।</li>
</ul>
<h3>৬. সেলার</h3>
<p>FashionPy-এ বিক্রয় <strong>Seller Policy</strong>-এর অধীনে — তালিকার দায়িত্ব, কমিশন, ফুলফিলমেন্ট ও পেআউট নিয়মসহ।</p>
<h3>৭. বৌদ্ধিক সম্পদ</h3>
<p>FashionPy-এর নাম, লোগো, সফটওয়্যার ও সাইটের কনটেন্ট FashionPy বা লাইসেন্সদাতার — অনুমতি ছাড়া ব্যবহার নয়।</p>
<h3>৮. দায়বদ্ধতা</h3>
<p>বাংলাদেশি আইন অনুমতি পর্যন্ত: প্ল্যাটফর্ম “as is” ভিত্তিক; পরোক্ষ/ফলপ্রসূ ক্ষতির জন্য আমরা দায়ী নই; যেকোনো দাবিতে আমাদের সর্বোচ্চ দায় সংশ্লিষ্ট অর্ডারের পরিশোধিত মূল্যের সমান। ভোক্তা অধিকার সীমাবদ্ধ হয় না — Consumer Rights Protection Act, 2009 অনুযায়ী অধিকার অক্ষত থাকবে।</p>
<h3>৯. প্রযোজ্য আইন</h3>
<p>এই শর্তাবলি বাংলাদেশের আইন দ্বারা পরিচালিত; ঢাকার আদালতের একচ্ছত্র এখতিয়ার প্রযোজ্য।</p>
<h3>১০. পরিবর্তন</h3>
<p>আমরা শর্তাবলি আপডেট করতে পারি; “last updated” তারিখ বর্তমান সংস্করণ দেখায়। পরিবর্তনের পর ব্যবহার চালিয়ে গেলে সম্মতি বলে গণ্য হয়।</p>
`.trim(),
  },
  {
    slug: "seller-policy",
    title: "Seller Policy",
    excerpt:
      "How selling on FashionPy works — approval, listings, commission, fulfilment and payouts.",
    content: `
<p><em>Last updated: ${UPDATED}</em></p>

<h2>English</h2>
<p>These rules apply to every seller on FashionPy.</p>
<h3>1. Getting started</h3>
<ul>
  <li>Apply from the seller panel with valid business/personal information. FashionPy reviews and approves every application.</li>
  <li>You are responsible for the legality of your products and your tax compliance in Bangladesh.</li>
</ul>
<h3>2. Listings</h3>
<ul>
  <li>Provide <strong>accurate titles, descriptions, images and stock</strong>. Listing counterfeit, used or misrepresented items is prohibited and may suspend your account.</li>
  <li>Price in <strong>BDT (৳)</strong>. The price you list is the price the buyer pays (delivery shown separately at checkout).</li>
  <li>Keep stock and prices up to date — overselling leads to cancellations that harm your rating.</li>
</ul>
<h3>3. Commission</h3>
<p>FashionPy charges a commission on each completed sale. The <strong>current default is 10%</strong> of the item amount (excluding delivery charges and tax); any custom rate for your store is shown in your dashboard. Rates may be updated with notice in the seller panel.</p>
<h3>4. Fulfilment</h3>
<ul>
  <li>Dispatch within <strong>1–3 business days</strong> of order confirmation and hand the parcel to our courier partners (Pathao/Steadfast) or prepare it for pickup.</li>
  <li>Package items safely; fashion items must reach the buyer clean, undamaged and as described.</li>
</ul>
<h3>5. Returns, exchanges & claims</h3>
<p>The platform-wide <strong>30-day window</strong> applies. You must accept eligible returns/exchanges; refunds are settled through the platform according to its rules.</p>
<h3>6. Payouts</h3>
<ul>
  <li>After an order is completed and the return window closes, your earnings (sale amount minus commission) are released to your registered payout account — <strong>bank transfer, bKash or Nagad</strong> — per the payout schedule shown in your dashboard.</li>
  <li>Pending returns, disputes or verification checks may hold a payout until resolved.</li>
</ul>
<h3>7. Fair conduct</h3>
<ul>
  <li>No fake orders, review manipulation, off-platform diversion of buyers, or listing of prohibited products (see Product Policy).</li>
  <li>Repeated late dispatches, cancellations or policy breaches can lead to restrictions or removal.</li>
</ul>

<h2>বাংলা</h2>
<p>FashionPy-এর প্রতিটি সেলারের জন্য এই নিয়ম প্রযোজ্য।</p>
<h3>১. শুরু</h3>
<ul>
  <li>সেলার প্যানেল থেকে বৈধ তথ্যসহ আবেদন করুন; প্রতিটি আবেদন FashionPy পর্যালোচনা ও অনুমোদন করে।</li>
  <li>পণ্যের বৈধতা ও বাংলাদেশে কর সম্পর্কিত আপনার দায়িত্ব।</li>
</ul>
<h3>২. তালিকা</h3>
<ul>
  <li><strong>সঠিক শিরোনাম, বিবরণ, ছবি ও স্টক</strong> দিন। নকল, ব্যবহৃত বা ভুল তথ্যসহ পণ্য নিষিদ্ধ — অ্যাকাউন্ট স্থগিত হতে পারে।</li>
  <li>দাম <strong>বাংলাদেশি টাকায় (৳)</strong>। যে দাম দেখান সেটিই ক্রেতা দেবে (ডেলিভারি চার্জ চেকআউটে আলাদা)।</li>
  <li>স্টক ও দাম হালনাগাদ রাখুন — বেশি বিক্রয়ে অর্ডার বাতিল হয় ও রেটিং নষ্ট হয়।</li>
</ul>
<h3>৩. কমিশন</h3>
<p>প্রতিটি সম্পন্ন বিক্রয়ে FashionPy কমিশন নেয়। <strong>বর্তমান ডিফল্ট ১০%</strong> (ডেলিভারি চার্জ ও কর বাদে পণ্যের অরক্ষিতমূল্যের); আপনার স্টোরের জন্য কোনো কাস্টম রেট থাকলে ড্যাশবোর্ডে দেখানো হয়। রেট সেলার প্যানেলে জানিয়ে পরিবর্তন হতে পারে।</p>
<h3>৪. ফুলফিলমেন্ট</h3>
<ul>
  <li>অর্ডার নিশ্চিত হওয়ার <strong>১–৩ কর্মদিবসের</strong> মধ্যে ডিসপ্যাচ করুন এবং পার্সেল Pathao/Steadfast-এ হস্তান্তর বা পিকআপের জন্য প্রস্তুত করুন।</li>
  <li>পণ্য নিরাপদভাবে প্যাক করুন; পোশাক পরিষ্কার, অক্ষত ও বর্ণনামতো পৌঁছাতে হবে।</li>
</ul>
<h3>৫. রিটার্ন, বদল ও দাবি</h3>
<p>প্ল্যাটফর্ম-ব্যাপী <strong>৩০ দিনের</strong> নিয়ম প্রযোজ্য। যোগ্য রিটার্ন/বদল গ্রহণ করতে হবে; রিফান্ড প্ল্যাটফর্মের নিয়মে নিষ্পত্তি হয়।</p>
<h3>৬. পেআউট</h3>
<ul>
  <li>অর্ডার সম্পন্ন ও রিটার্ন উইনডো শেষ হলে আপনার আয় (বিক্রয়ের টাকা কমিশন বাদে) নিবন্ধিত পেআউট অ্যাকাউন্টে ছাড়া হয় — <strong>ব্যাংক ট্রান্সফার, bKash বা Nagad</strong> — ড্যাশবোর্ডের সময়সূচি অনুযায়ী।</li>
  <li>অমীমাংসিত রিটার্ন, বিরোধ বা যাচাইয়ের অপেক্ষায় পেআউট স্থগিত থাকতে পারে।</li>
</ul>
<h3>৭. ন্যায্য আচরণ</h3>
<ul>
  <li>নকল অর্ডার, রিভিউ কারচুপি, প্ল্যাটফর্মের বাইরে ক্রেতা নেওয়া বা নিষিদ্ধ পণ্য তালিকা নয় (Product Policy দেখুন)।</li>
  <li>বারবার দেরিতে ডিসপ্যাচ, বাতিল বা নীতি লঙ্ঘনে বিধিনিষেধ বা অপসারণ হতে পারে।</li>
</ul>
`.trim(),
  },
  {
    slug: "product-policy",
    title: "Product Policy",
    excerpt:
      "What may be sold on FashionPy — authenticity, accuracy, pricing and prohibited items.",
    content: `
<p><em>Last updated: ${UPDATED}</em></p>

<h2>English</h2>
<p>This policy governs every product listed on FashionPy — set by the marketplace and enforced for all sellers.</p>
<h3>1. What we sell</h3>
<p>FashionPy is a fashion and lifestyle marketplace for Bangladesh: apparel, footwear, accessories, beauty and related categories. Every listing must fit these categories.</p>
<h3>2. Accuracy</h3>
<ul>
  <li><strong>Images must show the actual product</strong> (colour, cut, material). Stock photos of a different item are not allowed.</li>
  <li>Descriptions must state fabric, size chart, and any defects truthfully. Size and fit information must be provided.</li>
  <li>Only new, unused items may be listed as new. Pre-owned items must be labelled as such.</li>
</ul>
<h3>3. Pricing</h3>
<ul>
  <li>All prices are in <strong>BDT (৳)</strong> and include applicable taxes unless clearly stated.</li>
  <li>Artificially inflated “original” prices to show fake discounts are prohibited.</li>
</ul>
<h3>4. Authenticity & quality</h3>
<ul>
  <li>Sellers guarantee their products are <strong>genuine and as described</strong>. Counterfeit or replica branded goods are strictly prohibited.</li>
  <li>Cosmetics and personal-care items must be within shelf life and properly labelled.</li>
  <li>Products must comply with applicable Bangladeshi consumer and safety requirements.</li>
</ul>
<h3>5. Prohibited products</h3>
<p>Not allowed: weapons and ammunition, drugs and narcotics, tobacco/age-restricted goods to minors, adult or obscene material, expired food or cosmetics, recalled products, live animals, and any item restricted under Bangladeshi law. FashionPy may remove listings or suspend accounts that violate this policy; such sales are not eligible for marketplace protection.</p>

<h2>বাংলা</h2>
<p>FashionPy-এ তালিকাভুক্ত প্রতিটি পণ্য এই নীতির অধীন — মার্কেটপ্লেস সেট করে ও সকল সেলারের জন্য প্রযোজ্য।</p>
<h3>১. যা বিক্রি হয়</h3>
<p>FashionPy বাংলাদেশের ফ্যাশন ও লাইফস্টাইল মার্কেটপ্লেস: পোশাক, জুতা, এক্সেসরি, বিউটি ও সংশ্লিষ্ট ক্যাটাগরি। প্রতিটি তালিকা এই ক্যাটাগরিতে ফিট করতে হবে।</p>
<h3>২. সঠিকতা</h3>
<ul>
  <li><strong>ছবি আসল পণ্য দেখাতে হবে</strong> (রঙ, কাট, কাপড়)। অন্য পণ্যের স্টক ফটো চলবে না।</li>
  <li>বিবরণে কাপড়, সাইজ চার্ট ও কোনো ত্রুটি সত্যিসারে উল্লেখ থাকবে; সাইজ ও ফিটের তথ্য দিতে হবে।</li>
  <li>নতুন হিসেবে তালিকাভুক্ত পণ্য নতুন ও অব্যবহার করা হতে হবে; ব্যবহৃত পণ্য সেভাবেই চিহ্নিত হবে।</li>
</ul>
<h3>৩. মূল্য</h3>
<ul>
  <li>সব দাম <strong>বাংলাদেশি টাকায় (৳)</strong> এবং স্পষ্ট না বলা পর্যন্ত প্রযোজ্য কর অন্তর্ভুক্ত।</li>
  <li>ছাড় দেখাতে কৃত্রিমভাবে বাড়ানো “আসল” দাম নিষিদ্ধ।</li>
</ul>
<h3>৪. খাঁটিতা ও মান</h3>
<ul>
  <li>সেলার নিশ্চিত করেন পণ্য <strong>খাঁটি ও বর্ণনামতো</strong>। নকল বা রেপ্লিকা ব্র্যান্ডেড পণ্য কঠোরভাবে নিষিদ্ধ।</li>
  <li>কসমেটিক ও পার্সোনাল-কেয়ার পণ্য মেয়াদোত্তীর্ণ নয় ও সঠিকভাবে লেবেলকৃত হতে হবে।</li>
  <li>পণ্য বাংলাদেশের প্রযোজ্য ভোক্তা ও নিরাপত্তা বিধিমালা মেনে চলতে হবে।</li>
</ul>
<h3>৫. নিষিদ্ধ পণ্য</h3>
<p>যা চলবে না: অস্ত্র ও গোলাবারুদ, মাদক ও নশীল দ্রব্য, অপ্রাপ্তবয়স্কদের কাছে তামাক/বয়স-সংক্রান্ত পণ্য, পর্নোগ্রাফিক বা অশ্লীল মাল, মেয়াদোত্তীর্ণ খাদ্য বা কসমেটিক, রিকল করা পণ্য, জীবজন্তু, এবং বাংলাদেশি আইনে যা সীমাবদ্ধ। এই নীতি লঙ্ঘনে FashionPy তালিকা সরাতে বা অ্যাকাউন্ট স্থগিত করতে পারে; এসব বিক্রয় মার্কেটপ্লেস সুরক্ষার অন্তর্ভুক্ত নয়।</p>
`.trim(),
  },
  {
    slug: "pickup-delivery",
    title: "Pickup & Delivery Policy",
    excerpt:
      "Home delivery vs seller pickup, handover checks and failed delivery attempts.",
    content: `
<p><em>Last updated: ${UPDATED}</em></p>

<h2>English</h2>
<p>FashionPy offers two ways to get your order, depending on the seller and your address.</p>
<h3>1. Home delivery</h3>
<ul>
  <li>Delivered by our courier partners <strong>Pathao</strong> and <strong>Steadfast</strong> to the address you give at checkout.</li>
  <li>Estimates: Dhaka metro typically 1–2 business days, outside Dhaka typically 2–5 business days after dispatch (see Shipping Policy).</li>
  <li>Delivery charges, if any, are shown at checkout; free-delivery offers apply when running.</li>
</ul>
<h3>2. Seller pickup (where offered)</h3>
<ul>
  <li>If a seller offers pickup, the option appears at checkout along with their pickup point details.</li>
  <li>Bring your order reference (and a matching ID where requested) during the pickup window; staff will hand over the parcel after a quick check.</li>
</ul>
<h3>3. At handover — please check</h3>
<ul>
  <li>Confirm the parcel looks right and the packaging is intact before signing or paying — especially for <strong>Cash on Delivery</strong>, where you may pay the courier.</li>
  <li>If the parcel is visibly damaged, you may refuse it; note the reason with the courier and report it from Your Orders.</li>
</ul>
<h3>4. Failed deliveries</h3>
<ul>
  <li>If we cannot reach you (wrong/missing phone, nobody home), the courier re-attempts as per their policy; repeated failures return the parcel to the seller — treat it as a cancellation or use your 30-day return rights after a successful delivery.</li>
  <li>Remote areas may take longer; track live status in Your Orders.</li>
</ul>

<h2>বাংলা</h2>
<p>সেলার ও আপনার ঠিকানাভেদে FashionPy দুইভাবে অর্ডার দেয়।</p>
<h3>১. হোম ডেলিভারি</h3>
<ul>
  <li>আমাদের কুরিয়ার অংশীদার <strong>Pathao</strong> ও <strong>Steadfast</strong> চেকআউটে দেওয়া ঠিকানায় ডেলিভারি করে।</li>
  <li>সময়: ডিসপ্যাচের পর ঢাকা মেট্রো সাধারণত ১–২ কর্মদিবস, ঢাকার বাইরে সাধারণত ২–৫ কর্মদিবস (Shipping Policy দেখুন)।</li>
  <li>ডেলিভারি চার্জ (থাকলে) চেকআউটে দেখানো হয়; ফ্রি ডেলিভারি অফার চালু থাকলে প্রযোজ্য।</li>
</ul>
<h3>২. সেলার পিকআপ (যেখানে দেওয়া হয়)</h3>
<ul>
  <li>সেলার পিকআপ দিলে চেকআউটে সেই অপশন ও পিকআপ পয়েন্টের বিবরণ দেখা যাবে।</li>
  <li>নির্ধারিত সময়ে অর্ডার রেফারেন্স (দরকার হলে মিলে যায় এমন পরিচয়পত্র) নিয়ে যান; সংক্ষিপ্ত যাচাইয়ের পর পার্সেল হস্তান্তর হবে।</li>
</ul>
<h3>৩. হস্তান্তরের সময় — অবশ্যই যাচাই করুন</h3>
<ul>
  <li>স্বাক্ষর বা পেমেন্টের আগে পার্সেল ও প্যাকেজিং ঠিক আছে কিনা দেখুন — বিশেষত <strong>ক্যাশ অন ডেলিভারিতে</strong>, যেখানে কুরিয়ারকে টাকা দিতে হতে পারে।</li>
  <li>পার্সেল স্পষ্টভাবে ক্ষতিগ্রস্ত হলে নিতে অস্বীকার করতে পারেন; কুরিয়ারের কাছে কারণ লিখিয়ে Your Orders থেকে জানান।</li>
</ul>
<h3>৪. ব্যর্থ ডেলিভারি</h3>
<ul>
  <li>যোগাযোগ না হলে (ভুল/অনুপস্থিত ফোন, বাড়িতে কেউ না থাকলে) কুরিয়ার নিয়ম অনুযায়ী আবার চেষ্টা করে; বারবার ব্যর্থ হলে পার্সেল সেলারের কাছে ফিরে যায় — সেটি বাতিল হিসেবে গণ্য করুন, অথবা সফল ডেলিভারির পর ৩০ দিনের রিটার্ন অধিকার ব্যবহার করুন।</li>
  <li>দূরবর্তী এলাকায় সময় বেশি লাগতে পারে; Your Orders-এ লাইভ অবস্থা দেখুন।</li>
</ul>
`.trim(),
  },
]
