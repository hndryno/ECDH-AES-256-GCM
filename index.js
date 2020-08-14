const crypto = require('crypto')

const distributor = crypto.createECDH('secp256k1')
distributor.generateKeys()

const customer = crypto.createECDH('secp256k1')
customer.generateKeys()

const distributoPublicKeyBase64 = distributor.getPublicKey().toString('base64')
const customerPublicKeyBase64 = customer.getPublicKey().toString('base64')

const distributorSharedKey = distributor.computeSecret(customerPublicKeyBase64, 'base64', 'hex')
const customerSharedKey = customer.computeSecret(distributoPublicKeyBase64, 'base64', 'hex')

console.log('distributor shared key: ', distributorSharedKey)
console.log('customer shared key: ', customerSharedKey)

//message
const message = 'halo woi hehehe'

const IV = crypto.randomBytes(16)

const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(distributorSharedKey, 'hex'), IV)

let encrypted = cipher.update(message, 'utf8', 'hex')
encrypted += cipher.final('hex')

const auth_tag = cipher.getAuthTag().toString('hex')

console.table({
    IV: IV.toString('hex'),
    encrypt: encrypted,
    auth_tag: auth_tag
})

const payload = IV.toString('hex') + encrypted + auth_tag
const payload64 = Buffer.from(payload,'hex').toString('base64')

console.log(payload64)

//customer will do from here
customer_payload = Buffer.from(payload64, 'base64').toString('hex')

const customer_iv = customer_payload.substr(0,32)
const customer_encrypted = customer_payload.substr(32, customer_payload.length - 32 - 32)
const customer_auth_tag = customer_payload.substr(customer_payload.length - 32, 32)

console.table({
    customer_iv,customer_encrypted,customer_auth_tag
})

try{
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(customerSharedKey,'hex'),
        Buffer.from(customer_iv,'hex')
    )

    decipher.setAuthTag(Buffer.from(customer_auth_tag, 'hex'))

    let decrypted = decipher.update(customer_encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    console.log(decrypted)
}catch(err){
    console.log(err.message)
}