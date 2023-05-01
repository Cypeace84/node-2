// import { access, constants } from 'node:fs';
const Jimp = require('jimp');
const inquirer = require('inquirer');
const { access } = require('node:fs');
const constants = require('node:fs');

const addTextWatermarkToImage = async function (inputFile, outputFile, text) {
  const image = await Jimp.read(inputFile);
  console.log(image.getWidth(), image.getHeight());
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
  const textData = {
    text,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
  };
  // image.print(font, 10, 10, text);
  image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
  await image.quality(100).writeAsync(outputFile);
  console.log('Text watermark added successfully!');
  startApp();
};

const addImageWatermarkToImage = async function (
  inputFile,
  outputFile,
  watermarkFile
) {
  const image = await Jimp.read(inputFile);
  const watermarkSource = await Jimp.read(watermarkFile);
  const watermark = watermarkSource.resize(Jimp.AUTO, 100);
  image.composite(watermark, 0, 0, {
    mode: Jimp.BLEND_SOURCE_OVER,
    opacitySource: 0.5,
  });
  const x = image.getWidth() / 2 - watermark.getWidth() / 2;
  const y = image.getHeight() / 2 - watermark.getHeight() / 2;
  await image.quality(100).writeAsync(outputFile);
  console.log('Image watermark added successfully!');
  startApp();
};

const startApp = async () => {
  // Ask if user is ready
  const answer = await inquirer.prompt([
    {
      name: 'start',
      message:
        'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm',
    },
  ]);

  // if answer is no, just quit the app
  if (!answer.start) process.exit();

  const prepareOutputFilename = (filename) => {
    const [name, ext] = filename.split('.');
    return `${name}-with-watermark.${ext}`;
  };
  ///////////////////////////
  // const isFiles = (file1) => {
  //   access(file1, constants.F_OK, (err) => {
  //     if (err) {
  //       return false;
  //     } else {
  //       return true;
  //     }
  //   });
  // };

  const isFiles = (file1) => {
    return new Promise((resolve, reject) => {
      access(file1, constants.F_OK, (err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  };

  ///////////////////////////
  // ask about input file and watermark type
  const options = await inquirer.prompt([
    {
      name: 'inputImage',
      type: 'input',
      message: 'What file do you want to mark?',
      default: 'test.jpg',
    },
    {
      name: 'watermarkType',
      type: 'list',
      choices: ['Text watermark', 'Image watermark'],
    },
  ]);

  if (options.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([
      {
        name: 'value',
        type: 'input',
        message: 'Type your watermark text:',
      },
    ]);
    options.watermarkText = text.value;

    const file = './img/' + options.inputImage;
    access(file, constants.F_OK, (err) => {
      if (err) {
        console.log(`${file} 'does not exist'`);
      } else {
        try {
          addTextWatermarkToImage(
            './img/' + options.inputImage,
            './img/' + prepareOutputFilename(options.inputImage),
            options.watermarkText
          );
        } catch (error) {
          console.log('Something went wrong... Try again!');
        }
      }
    });
  } else {
    const image = await inquirer.prompt([
      {
        name: 'filename',
        type: 'input',
        message: 'Type your watermark name:',
        default: 'logo.png',
      },
    ]);
    options.watermarkImage = image.filename;

    const fileWatermarkImage = './img/' + options.watermarkImage;
    // console.log('file watermark image', fileWatermarkImage);
    const fileInputImage = './img/' + options.inputImage;
    // console.log('file input image', fileInputImage);

    const isFileInputImageExists = await isFiles(fileInputImage);
    const isFileWatermarkImageExists = await isFiles(fileWatermarkImage);
    if (!isFileInputImageExists && !isFileInputImageExists) {
      return console.log(
        `${fileInputImage} 'and' ${fileWatermarkImage} 'does not exists'`
      );
    }
    if (!isFileInputImageExists) {
      return console.log(`${fileInputImage} 'does not exist'`);
    }

    if (!isFileWatermarkImageExists) {
      return console.log(`${fileWatermarkImage} 'does not exist'`);
    }
    try {
      addImageWatermarkToImage(
        './img/' + options.inputImage,
        './img/' + prepareOutputFilename(options.inputImage),
        './img/' + options.watermarkImage
      );
    } catch (error) {
      console.log('Something went wrong... Try again!');
    }
  }
};

startApp();
