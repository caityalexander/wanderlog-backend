import { connect } from './config/db';
import express from './config/express';
import Logger from './config/logger'
const app = express();
// Connect to MySQL on start
async function main() {
    try {
        await connect();
        app.listen(process.env.SENG365_PORT || 3000, () => {
            Logger.info('Listening on port: ' + process.env.SENG365_PORT||3000)
            });
        } catch (err) {
        Logger.error('Unable to connect to MySQL.');
        Logger.error(err);
        process.exit(1);
        }
    }
main().catch(err => Logger.error(err));