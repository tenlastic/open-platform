import * as fs from 'fs';
import * as glob from 'glob';
import * as mkdirp from 'mkdirp';
import * as Mustache from 'mustache';
import * as path from 'path';
import * as pluralize from 'pluralize';

const cwd = path.resolve(__dirname, '../templates/api/');

// Parse the given name parameter.
const nameCamelSingular = process.argv[2];
if (!nameCamelSingular || !nameCamelSingular.length) {
  throw new Error('A name is required.');
}

// Convert the name to other cases.
const nameCamelPlural = pluralize(nameCamelSingular);
const namePascalSingular = nameCamelSingular.charAt(0).toUpperCase() + nameCamelSingular.slice(1);
const namePascalPlural = nameCamelPlural.charAt(0).toUpperCase() + nameCamelPlural.slice(1);
const nameKebabSingular = nameCamelSingular.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const nameKebabPlural = nameCamelPlural.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

// Parse the given target directory parameter.
const destinationRoot = path.resolve(__dirname, '../', process.argv[3]);

const filePaths = glob.sync('**/*.mustache', { cwd });
for (const filePath of filePaths) {
  const contents = fs.readFileSync(path.resolve(cwd, filePath), 'utf-8');

  // Substitute in values within Mustache files.
  const values = {
    nameCamelPlural,
    nameCamelSingular,
    nameKebabPlural,
    nameKebabSingular,
    namePascalPlural,
    namePascalSingular,
  };
  const result = Mustache.render(contents, values);

  // Remove the .mustache suffix from filenames.
  let destinationFilePath = path.resolve(destinationRoot, filePath.replace(/\.mustache/g, ''));

  // Substitute any values within filename.
  Object.keys(values).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    destinationFilePath = destinationFilePath.replace(regex, values[key]);
  });

  // Save file to target path.
  mkdirp.sync(path.dirname(destinationFilePath));
  fs.writeFileSync(destinationFilePath, result);
}
