module.exports = {
  apps : [{
    name: 'SILKServer2',
    script: 'index.js',
    instances : '1',
    watch: "app/*",
    max_memory_restart: '1024M',
    exec_mode : "cluster",
    env: {
        "NODE_ENV": "production"
    }
  }]
};
