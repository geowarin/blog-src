const path = require('path');

const algoliasearch = require('algoliasearch');
const glob = require('glob');

const client = algoliasearch(
  "7DRJRSRA5B",
  process.env.ALGOLIA_ADMIN_API_KEY
);
const indexName = 'blog';

const publicDir = path.resolve(process.argv[2] || 'public');

const objectsPaths = glob.sync('**/search/index.json', {
  cwd: publicDir,
  absolute: true
});

const indicesInfo = objectsPaths.map(objectsPath => ({
  path: objectsPath,
  name: `${indexName}${objectsPath
    .slice(publicDir.length, -'/search/index.json'.length)
    .replace('/', '_')}`
}));

indicesInfo.forEach(indexInfo => {
  const objects = require(indexInfo.path);
  console.log(indexInfo.path);

  // const index = client.initIndex(indexInfo.name);
  // index.addObjects(objects, (err, _content) => {
  //   if (err) {
  //     console.error(err.toString());
  //   } else {
  //     console.log(`Algolia Index Generated for: ${indexInfo.path.replace(publicDir, '')}`)
  //   }
  // })
});
