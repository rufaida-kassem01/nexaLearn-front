import logo from './logo.svg'
import logo_dark from './logo_dark.svg'
import search_icon from './search_icon.svg'
import cross_icon from './cross_icon.svg'
import upload_area from './upload_area.svg'
import sketch from './sktech.svg'

import course_1_thumbnail from './course_1.png'
import course_2_thumbnail from './course_2.png'
import course_3_thumbnail from './course_3.png'
import course_4_thumbnail from './course_4.png'
import star from './rating_star.svg'
import star_blank from './star_dull_icon.svg'
import profile_img_1 from './profile_img_1.png'
import profile_img_2 from './profile_img_2.png'
import profile_img_3 from './profile_img_3.png'
import arrow_icon from './arrow_icon.svg'
import down_arrow_icon from './down_arrow_icon.svg'
import time_clock_icon from './time_clock_icon.svg'
import user_icon from './user_icon.svg'
import home_icon from './home_icon.svg'
import add_icon from './add_icon.svg'
import my_course_icon from './my_course_icon.svg'
import person_tick_icon from './person_tick_icon.svg'
import facebook_icon from './facebook_icon.svg'
import instagram_icon from './instagram_icon.svg'
import twitter_icon from './twitter_icon.svg'
import file_upload_icon from './file_upload_icon.svg'
import earning_icon from './earning_icon.svg'
import dropdown_icon from './dropdown_icon.svg'
import patients_icon from './patients_icon.svg'
import play_icon from './play_icon.svg'
import blue_tick_icon from './blue_tick_icon.svg'
import course_4 from './course_4.png'
import profile_img from './profile_img.png'

import lesson_icon from './lesson_icon.svg'

export const assets = {
    logo,
    search_icon,
    sketch,
    course_1_thumbnail,
    course_2_thumbnail,
    course_3_thumbnail,
    course_4_thumbnail,
    star,
    star_blank,
    profile_img_1,
    profile_img_2,
    profile_img_3,
    arrow_icon,
    dropdown_icon,
    cross_icon,
    upload_area,
    logo_dark,
    down_arrow_icon,
    time_clock_icon,
    user_icon,
    home_icon,
    add_icon,
    my_course_icon,
    person_tick_icon,
    facebook_icon,
    instagram_icon,
    twitter_icon,
    course_4,
    file_upload_icon,
    earning_icon,
    patients_icon,
    profile_img,
    play_icon,
    blue_tick_icon,
    lesson_icon
}

export const dummyTestimonial = [
    {
        name: 'Donald Jackman',
        role: 'SWE 1 @ Amazon',
        image: assets.profile_img_1,
        rating: 5,
        feedback: 'I\'ve been using Imagify for nearly two years, primarily for Instagram, and it has been incredibly user-friendly, making my work much easier.',
    },
    {
        name: 'Richard Nelson',
        role: 'SWE 2 @ Samsung',
        image: assets.profile_img_2,
        rating: 4,
        feedback: 'I\'ve been using Imagify for nearly two years, primarily for Instagram, and it has been incredibly user-friendly, making my work much easier.',
    },
    {
        name: 'James Washington',
        role: 'SWE 2 @ Google',
        image: assets.profile_img_3,
        rating: 4.5,
        feedback: 'I\'ve been using Imagify for nearly two years, primarily for Instagram, and it has been incredibly user-friendly, making my work much easier.',
    },
]

import type { Course } from '../types'

export const dummyCourses: Course[] = [
    {
        id: "605c72efb3f1c2b1f8e4e1a1",
        title: "Introduction to JavaScript",
        description: "<h2>Learn the Basics of JavaScript</h2><p>JavaScript is a versatile programming language that powers the web. In this course, you will learn the fundamentals of JavaScript, including syntax, data types, and control structures.</p><p>This course is perfect for beginners who want to start their journey in web development. By the end of this course, you will be able to create interactive web pages and understand the core concepts of JavaScript.</p><ul><li>Understand the basics of programming</li><li>Learn how to manipulate the DOM</li><li>Create dynamic web applications</li></ul>",
        basePrice: 49.99,
        isFree: false,
        status: "PUBLISHED",
        modules: [
            {
                id: "chapter1",
                orderIndex: 1,
                title: "Getting Started with JavaScript",
                lessons: [
                    {
                        id: "lecture1",
                        title: "What is JavaScript?",
                        durationSecs: 960,
                        contentUrl: "https://youtu.be/CBWnBi-awSA",
                        isPreview: true,
                        orderIndex: 1,
                        contentType: "video",
                    },
                    {
                        id: "lecture2",
                        title: "Setting Up Your Environment",
                        durationSecs: 1140,
                        contentUrl: "https://youtu.be/4l87c2aeB4I",
                        isPreview: false,
                        orderIndex: 2,
                        contentType: "video",
                    },
                ],
            },
            {
                id: "chapter2",
                orderIndex: 2,
                title: "Variables and Data Types",
                lessons: [
                    {
                        id: "lecture3",
                        title: "Understanding Variables",
                        durationSecs: 1200,
                        contentUrl: "https://youtu.be/pZQeBJsGoDQ",
                        isPreview: true,
                        orderIndex: 1,
                        contentType: "video",
                    },
                    {
                        id: "lecture4",
                        title: "Data Types in JavaScript",
                        durationSecs: 600,
                        contentUrl: "https://youtu.be/ufHT2WEkkC4",
                        isPreview: false,
                        orderIndex: 2,
                        contentType: "video",
                    },
                ],
            },
        ],
        instructorId: "675ac1512100b91a6d9b8b24",
        categoryId: "",
        language: "en",
        ratingAvg: 5,
        totalReviews: 1,
        totalEnrollments: 3,
        thumbnailUrl: "https://img.youtube.com/vi/CBWnBi-awSA/maxresdefault.jpg",
        createdAt: "2024-12-17T08:16:53.622Z",
        updatedAt: "2025-01-02T04:47:44.701Z",
    },
    {
        id: "675ac1512100b91a6d9b8b24",
        title: "Advanced Python Programming",
        description: "<h2>Deep Dive into Python Programming</h2><p>This course is designed for those who have a basic understanding of Python and want to take their skills to the next level. You will explore advanced topics such as decorators, generators, and context managers.</p><p>By the end of this course, you will be able to write efficient and clean Python code, and understand how to leverage Python's powerful features for real-world applications.</p><ul><li>Master advanced data structures</li><li>Implement object-oriented programming concepts</li><li>Work with libraries and frameworks</li></ul>",
        basePrice: 79.99,
        isFree: false,
        status: "PUBLISHED",
        modules: [
            {
                id: "chapter1",
                orderIndex: 1,
                title: "Advanced Data Structures",
                lessons: [
                    {
                        id: "lecture1",
                        title: "Lists and Tuples",
                        durationSecs: 43200,
                        contentUrl: "https://youtu.be/HdLIMoQkXFA",
                        isPreview: true,
                        orderIndex: 1,
                        contentType: "video",
                    },
                    {
                        id: "lecture2",
                        title: "Dictionaries and Sets",
                        durationSecs: 51000,
                        contentUrl: "https://youtu.be/HdLIMoQkXFA",
                        isPreview: false,
                        orderIndex: 2,
                        contentType: "video",
                    },
                ],
            },
            {
                id: "chapter2",
                orderIndex: 2,
                title: "Object-Oriented Programming",
                lessons: [
                    {
                        id: "lecture3",
                        title: "Classes and Objects",
                        durationSecs: 54000,
                        contentUrl: "https://youtu.be/HdLIMoQkXFA",
                        isPreview: true,
                        orderIndex: 1,
                        contentType: "video",
                    },
                    {
                        id: "lecture4",
                        title: "Inheritance and Polymorphism",
                        durationSecs: 57000,
                        contentUrl: "https://youtu.be/HdLIMoQkXFA",
                        isPreview: false,
                        orderIndex: 2,
                        contentType: "video",
                    },
                ],
            },
        ],
        instructorId: "675ac1512100b91a6d9b8b24",
        categoryId: "",
        language: "en",
        ratingAvg: 5,
        totalReviews: 1,
        totalEnrollments: 2,
        thumbnailUrl: "https://img.youtube.com/vi/HdLIMoQkXFA/maxresdefault.jpg",
        createdAt: "2024-12-17T08:16:53.622Z",
        updatedAt: "2025-01-02T06:47:54.446Z",
    },
]
