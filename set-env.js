const fs = require('fs');
const path = require('path');

const dir = './src/environments';
const fileName = 'environment.ts'; // Or environment.prod.ts depending on your import

// Create directory if it doesn't exist
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const content = `
export const environment = {
  production: true,
  apiUrl: '${process.env.API_URL}'
};
`;

fs.writeFileSync(path.join(dir, fileName), content);
console.log('Environment file generated successfully.');