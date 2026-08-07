import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export function EmailTemplateElement(props) {
  const { title, description, buttonText, actionLink, footerText, firstName } = props;

  return React.createElement(
    'html',
    null,
    React.createElement('head', null,
      React.createElement('meta', { charSet: 'utf-8' }),
      React.createElement('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' })
    ),
    React.createElement('body', { style: { fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 } },
      React.createElement('table', { role: 'presentation', width: '100%', cellPadding: 0, cellSpacing: 0, style: { background: '#f6f9fc', padding: '20px' } },
        React.createElement('tbody', null,
          React.createElement('tr', null,
            React.createElement('td', { align: 'center' },
              React.createElement('table', { role: 'presentation', width: 600, cellPadding: 0, cellSpacing: 0, style: { background: '#ffffff', borderRadius: 6, overflow: 'hidden' } },
                React.createElement('tbody', null,
                  React.createElement('tr', null,
                    React.createElement('td', { style: { padding: '30px' } },
                      React.createElement('h2', { style: { color: '#333' } }, title),
                      React.createElement('p', { style: { color: '#555', fontSize: 16 } }, `Hi ${firstName || ''},`),
                      React.createElement('p', { style: { color: '#555', fontSize: 16 } }, description),
                      React.createElement('div', { style: { margin: '30px 0' } },
                        React.createElement('a', { href: actionLink, style: { display: 'inline-block', padding: '12px 30px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: 5, fontWeight: 'bold' } }, buttonText)
                      ),
                      React.createElement('p', { style: { color: '#888', fontSize: 14 } }, 'Or copy and paste this link in your browser:', React.createElement('br'), React.createElement('small', null, actionLink)),
                      React.createElement('p', { style: { color: '#bbb', fontSize: 12, marginTop: 30 } }, footerText)
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}

export function renderEmailHtml(props) {
  const body = renderToStaticMarkup(EmailTemplateElement(props));
  return `<!doctype html>${body}`;
}
