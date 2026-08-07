import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export function EmailTemplate({ title, description, buttonText, actionLink, footerText, firstName }) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ background: '#f6f9fc', padding: '20px' }}>
          <tbody>
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellPadding="0" cellSpacing="0" style={{ background: '#ffffff', borderRadius: 6, overflow: 'hidden' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '30px' }}>
                        <h2 style={{ color: '#333' }}>{title}</h2>
                        <p style={{ color: '#555', fontSize: 16 }}>{`Hi ${firstName || ''},`}</p>
                        <p style={{ color: '#555', fontSize: 16 }}>{description}</p>
                        <div style={{ margin: '30px 0' }}>
                          <a href={actionLink} style={{ display: 'inline-block', padding: '12px 30px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: 5, fontWeight: 'bold' }}>{buttonText}</a>
                        </div>
                        <p style={{ color: '#888', fontSize: 14 }}>Or copy and paste this link in your browser:<br/><small>{actionLink}</small></p>
                        <p style={{ color: '#bbb', fontSize: 12, marginTop: 30 }}>{footerText}</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export function renderEmailHtml(props) {
  const body = renderToStaticMarkup(React.createElement(EmailTemplate, props));
  return `<!doctype html>${body}`;
}
