'use strict';

const KNOWN_STACK = ['node', 'typescript', 'react', 'python', 'django'];

function detectStack(repo) {
  const tags = new Set();
  const pkg = repo.json('package.json');
  if (pkg) {
    tags.add('node');
    const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies, pkg.peerDependencies);
    if (deps.react || deps['react-dom'] || deps.next) tags.add('react');
    if (deps.typescript || repo.match(['tsconfig.json', 'tsconfig.*.json']).length) tags.add('typescript');
  }
  if (repo.match(['pyproject.toml', 'requirements*.txt', 'Pipfile', 'setup.py', 'setup.cfg', 'manage.py']).length) tags.add('python');
  if (repo.match(['manage.py']).length || repo.hasDep(['django', 'Django'])) { tags.add('django'); tags.add('python'); }
  return [...tags];
}

module.exports = { KNOWN_STACK, detectStack };
