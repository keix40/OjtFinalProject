-- Insert default Return Policy with HTML content from Quill editor
INSERT INTO policies (title, content, status, last_updated) 
VALUES (
    'Return Policy',
    '<p>Customers are eligible to request returns under the following conditions. All return requests must be reviewed and approved by the admin before any refund or replacement is processed.</p>

<h3>1. Wrong Item Delivered</h3>
<p>If the item received is different from what was ordered, a return request must be submitted within 7 days of delivery.</p>
<p>Upon verification, a full refund will be issued.</p>

<h3>2. Damaged on Arrival</h3>
<p>If the item is received in a damaged or defective condition, photo evidence must be provided.</p>
<p>After verification by the admin, customers will be offered either a refund or a replacement.</p>

<h3>3. Changed Mind</h3>
<p>Returns due to a change of mind are accepted only if the product is unused and sealed.</p>
<p>The customer is responsible for the return shipping costs.</p>
<p>A refund will be processed after the returned product is inspected and approved.</p>

<h3>4. Return Process</h3>
<ul>
<li>Submit return request through the order tracking page</li>
<li>Provide clear photos of the item condition</li>
<li>Package item securely for return shipping</li>
<li>Wait for admin approval before shipping</li>
<li>Return shipping costs are the responsibility of the customer for change of mind returns</li>
</ul>

<h3>5. Refund Timeline</h3>
<ul>
<li>Refunds will be processed within 5-7 business days after receiving the returned item</li>
<li>Refunds will be issued to the original payment method</li>
<li>Processing times may vary depending on your bank or payment provider</li>
</ul>

<h3>6. Contact Information</h3>
<p>For questions about returns, please contact our customer service team.</p>',
    1,
    NOW()
) ON DUPLICATE KEY UPDATE 
    content = VALUES(content),
    last_updated = NOW(); 