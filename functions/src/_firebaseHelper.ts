import * as admin from 'firebase-admin'

export const firebase = !admin.apps.length ? admin.initializeApp() : admin.app();
