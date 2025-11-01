import * as yup from 'yup'

export const registerUserSchema = yup.object().shape({
    name: yup.string().required("Name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    phone: yup.string().nullable(),
    photoUrl: yup.string().nullable(),
    firebaseUID: yup.string().required('FirebaseUID is required!')
})