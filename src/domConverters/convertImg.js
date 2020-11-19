import html2canvas from 'html2canvas'
import $ from 'jquery'
import svgToCanvas from './helpers/svgToCanvas'
import imgTo64 from './helpers/imgTo64'
import { getDate } from '../utils'

export const convertImg = (_options) => {
  const _defaults = {
    target: 'body',
    captureHiddenClass: 'vti__hidden',
    captureShowClass: 'vti__show',
    captureActiveClass: 'vti__active',
    fileName: 'ImageCapture',
    fileType: 'png',
    returnAction: 'download',
    callback: (img) => { return img }
  }

  // Merge defaults and options, without modifying defaults
  const _settings = $.extend({}, _defaults, _options)

  // const fileName = _settings.fileName + getDate() + '.' + _settings.fileType
  const fileName = _settings.fileName + getDate() + '.' + _settings.fileType

  // For cors bugs and rendering issues
  // images are base64 encoded and replaced
  // after image rendering
  var srcList = []
  const imgList = (src) => {
    srcList.push(src)
  }

  // Functions
  const setUp = () => {
    $('body').addClass(_settings.captureActiveClass)
  }

  const cleanUp = (target) => {
    document.querySelectorAll(target + ' img').forEach((imageNode, index) => {
      imageNode = srcList[index]
    })
    $(_settings.target).find('.screenShotTempCanvas').remove()
    $(_settings.target).find('.tempHide').show().removeClass('tempHide')
    $('body').removeClass(_settings.captureActiveClass)
  }

  function canvasExport (callback) {
    return html2canvas($(_settings.target)[0], {
      async: true,
      allowTaint: true,
      useCORS: true,
      timeout: 1,
      letterRendering: true,
      background: '#ffffff',
      logging: false,
      scale: 2
    }).then((data) => {
      if (callback) return callback(data)
      return data
    })
  }

  function imageExport (canvasObj) {
    return canvasObj.toDataURL('image/' + _settings.fileType)
  }

  function downloadFile (uri) {
    var link = document.createElement('a')
    const downloadName = fileName
    if (typeof link.download === 'string') {
      link.href = uri
      link.download = downloadName

      // Firefox requires the link to be in the body
      document.body.appendChild(link)

      // simulate click
      link.click()

      // remove the link when done
      document.body.removeChild(link)
    } else {
      window.open(uri)
    }
    return uri
  }

  // Start Routine
  setUp()
  svgToCanvas(_settings.target)
  imgTo64(_settings.target, imgList)

  // Return image to use in desired format
  // Fire callback to handle file type
  let outputFile = null
  if (_settings.returnAction === 'download') {
    outputFile = canvasExport((canvas) => {
      return _settings.callback(
        downloadFile(
          imageExport(canvas)
        )
      )
    })
  } else if (_settings.returnAction === 'canvas') {
    outputFile = canvasExport((canvas) => {
      return _settings.callback(canvas)
    })
  } else if (_settings.returnAction === 'blob') {
    outputFile = canvasExport(
      (canvas) => {
        var blobObj = null
        canvas.toBlob((blob) => {
          blobObj = blob
        }, 'image/' + _settings.fileType)
        return _settings.callback(blobObj)
      }
    )
  } else if (_settings.returnAction === 'base64') {
    outputFile = canvasExport((canvas) => _settings.callback(
      imageExport(canvas)
    ))
  } else if (_settings.returnAction === 'clipboard') {
    outputFile = canvasExport(
      (canvas) => {
        var blobObj = null

        canvas.toBlob((blob) => {
          blobObj = blob
          // eslint-disable-next-line no-undef
          const item = new ClipboardItem({ 'image/png': blobObj })
          navigator.clipboard.write([item])
        }, 'image/png')
        return _settings.callback(blobObj)
      }
    )
  }

  console.log(outputFile)

  cleanUp(_settings.target)
  return outputFile
}
