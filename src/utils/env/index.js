const env = import.meta.env;

const envVariables = Object.keys(env).reduce((acc, key) => {
  if (key.startsWith('VITE_')) {
    acc[key] = env[key];
  }
  return acc;
}, {});

export default envVariables;