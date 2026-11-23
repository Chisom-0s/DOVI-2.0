const fs = require('fs');
const filePath = 'frontend/src/pages/Checkout/CheckoutPage.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const modalMarkup = `      {/* DOVI Launch Giveaway Promotional Pop-Up Modal */}
      {showGiveawayModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowGiveawayModal(false);
              setDismissedGiveawayModal(true);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '2px solid #ff7a00',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                backgroundColor: '#ff7a00',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🎁</span>
                <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Exclusive Launch Reward
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGiveawayModal(false);
                  setDismissedGiveawayModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '22px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: 0,
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#111827', margin: '0 0 8px', lineHeight: 1.3 }}>
                SHOP ₦30,000 OR MORE AND GET A FREE EARPOD!
              </h3>
              <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 16px', lineHeight: 1.5 }}>
                Congratulations! Your product subtotal is <strong>₦{computedSubtotal.toLocaleString()}</strong>. You have unlocked a complimentary DOVI Wireless EarPod with high-definition audio!
              </p>

              {/* Gift Item Card Preview */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  marginBottom: '20px',
                }}
              >
                <img
                  src={giveawayPromo?.gift_item?.image_url || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80'}
                  alt="DOVI Free EarPod"
                  style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    {giveawayPromo?.gift_item?.name || 'DOVI Free EarPod (Launch Edition)'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Includes portable wireless charging case & crystal-clear mic
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#15803d' }}>
                      ₦0.00
                    </span>
                    <span style={{ backgroundColor: '#15803d', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      FREE GIFT
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setClaimedGift(giveawayPromo?.gift_item || {
                      id: 'promo-gift-earpod-2026',
                      product_id: 'promo-gift-earpod-2026',
                      name: 'DOVI Free EarPod (Launch Edition)',
                      sku: 'DOV-GIFT-EARPOD-2026',
                      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
                    });
                    setShowGiveawayModal(false);
                    toast.success('Complimentary Free EarPod added to your order!');
                  }}
                  style={{
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    padding: '13px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(21, 128, 61, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Claim Free EarPod
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGiveawayModal(false);
                    setDismissedGiveawayModal(true);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: 'none',
                    padding: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  No thanks, continue without gift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

const target = `        </div>
      </div>
    </div>
  );
}`;

const replacement = `        </div>
      </div>
${modalMarkup}
    </div>
  );
}`;

if (content.includes(target) && !content.includes('DOVI Launch Giveaway Promotional Pop-Up Modal')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully inserted promotional modal into CheckoutPage.tsx');
} else {
  console.log('Already inserted or target not found');
}
