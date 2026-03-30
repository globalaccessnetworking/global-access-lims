module.exports = {
    apps: [
        {
            name: 'lims-backend',
            script: './server/server.js',
            cwd: './server',
            args: '5002',
            env: {
                NODE_ENV: 'production',
                PORT: 5002,
                DB_HOST: 'localhost',
                DB_USER: 'postgres',
                DB_PASSWORD: 'phagelabdrshafiq',
                DB_NAME: 'bacteriophage_lims'
            }
        },
        {
            name: 'lims-frontend',
            script: './client/node_modules/vite/bin/vite.js',
            args: ['--port', '5174', '--strictPort'],
            cwd: './client',
            interpreter: 'node',
            env: {
                NODE_ENV: 'development'
            }
        }
    ]
};
