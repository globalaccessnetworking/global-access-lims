import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Generates the JSON string for the QR code
 * @param {Object} item - The inventory or chemical item
 * @param {string} type - The type ('inventory' or 'chemical')
 * @returns {string} - JSON string for QR code
 */
export const generateQRData = (item, type = 'inventory') => {
    return JSON.stringify({
        id: item.qr_code_id || (type === 'chemical' ? `CHEM-${item.id}` : `INV-${item.id}`),
        type: type
    });
};

/**
 * Component to display a QR code
 */
export const QRCodeDisplay = ({ value, size = 200, level = 'H' }) => {
    return (
        <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
            <QRCodeSVG
                value={value}
                size={size}
                level={level}
                includeMargin={true}
            />
        </div>
    );
};
