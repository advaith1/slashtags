import admin from 'firebase-admin'

import serviceAccount from './firebase.json'

admin.initializeApp({
    // @ts-expect-error
    credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

db.settings({ ignoreUndefinedProperties: true })

export default db
